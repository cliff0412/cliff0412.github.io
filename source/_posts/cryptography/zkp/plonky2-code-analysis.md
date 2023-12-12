---
title: plonky2 code analysis
date: 2023-11-06 13:24:03
tags: [cryptography,zkp]
---

<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

## introduction
this post is a source code analysis of https://github.com/0xPolygonZero/plonky2

## 1. Config
### 1.1 CircuitConfig
the default config is `Self::standard_recursion_config()` with value as below
```rust
Self {
  num_wires: 135,
  num_routed_wires: 80, 
  num_constants: 2,  // used in ConstantGate, which hold the consant value for the circuit
  /// Whether to use a dedicated gate for base field arithmetic, rather than using a single gate
  /// for both base field and extension field arithmetic.
  use_base_arithmetic_gate: true,
  security_bits: 100,
  /// The number of challenge points to generate, for IOPs that have soundness errors of (roughly)
  /// `degree / |F|`.
  num_challenges: 2,
  zero_knowledge: false,
  /// A cap on the quotient polynomial's degree factor. The actual degree factor is derived
  /// systematically, but will never exceed this value.
  max_quotient_degree_factor: 8,
  fri_config: FriConfig {
      rate_bits: 3,  // used in lde
      cap_height: 4,
      proof_of_work_bits: 16,
      reduction_strategy: FriReductionStrategy::ConstantArityBits(4, 5),
      num_query_rounds: 28,
  },
}
```

**notes**
- *routable wire* It's a wire that can be connected to other gates' wires, rather than an "advice" wire which is for internal state. For example if we had a gate for computing x^8, we'd have two routable wires for the input and output, x and x^8. But if we wanted lower-degree constraints, we could add advice wires for the intermediate results x^2 and x^4

- *num_routed_wires*, the default value is 80. For eample, for a arithmetic gate, it computes `const_0 * multiplicand_0 * multiplicand_1 + const_1 * addend`. i.e 2 wires for multiplicands and 1 wire for the addend and 1 for output. total is 4. therefore, the gate can have `num_routed_wires/4` operations, in this case, it is 20. the circuit builder will add gate when number of operations exceeds 20.

### 1.2 FriConfig
```rust
pub struct FriConfig {
/// `rate = 2^{-rate_bits}`. default is 3
pub rate_bits: usize,  

/// Height of Merkle tree caps. default is 4
pub cap_height: usize,
/// default is 16
pub proof_of_work_bits: u32,

pub reduction_strategy: FriReductionStrategy,

/// Number of query rounds to perform. default is 28
pub num_query_rounds: usize,
}
```

## 2. Gates
```rust
/// A custom gate.
pub trait Gate<F: RichField + Extendable<D>, const D: usize>: 'static + Send + Sync {
    fn id(&self) -> String;
    /// The maximum degree among this gate's constraint polynomials. it is 3 for ArithmeticGate (Left, Right, Output); 7 for PoseidonGate, 1 for ConstantGate, PublicInputGate;
    fn degree(&self) -> usize;

    /// The generators used to populate the witness.
    /// Note: This should return exactly 1 generator per operation in the gate.
    fn generators(&self, row: usize, local_constants: &[F]) -> Vec<WitnessGeneratorRef<F, D>>;

    /// Enables gates to store some "routed constants", if they have both unused constants and
    /// unused routed wires.
    ///
    /// Each entry in the returned `Vec` has the form `(constant_index, wire_index)`. `wire_index`
    /// must correspond to a *routed* wire.
    /// for ConstantGate, the size of vector is equal to num_of_consts, it's empty for ArithmeticGate, PublicInputGate, and PoseidonGate
    fn extra_constant_wires(&self) -> Vec<(usize, usize)> {
        vec![]
    }
}
```
### ArithmeticGate
```rust
/// A gate which can perform a weighted multiply-add, i.e. `result = c0 x y + c1 z`. If the config
/// supports enough routed wires, it can support several such operations in one gate.
pub struct ArithmeticGate {
    /// Number of arithmetic operations performed by an arithmetic gate.
    pub num_ops: usize,
}

/// A gate which takes a single constant parameter and outputs that value.
pub struct ConstantGate {
    pub(crate) num_consts: usize,
}
/// for constant gate, the evaluation is just input - wire output, the result should be 0
fn eval_unfiltered(&self, vars: EvaluationVars<F, D>) -> Vec<F::Extension> {
    (0..self.num_consts)
        .map(|i| {
            vars.local_constants[self.const_input(i)] - vars.local_wires[self.wire_output(i)]
        })
        .collect()
}

/// A gate whose first four wires will be equal to a hash of public inputs. the value 4 is hadcoded as the hash
/// out inputs is 4 Targets. PublicInputGate is aliased as pi gate
pub struct PublicInputGate;
impl PublicInputGate {
    pub fn wires_public_inputs_hash() -> Range<usize> {
        0..4
    }
}
```

## 3. Circuit Builder
```rust
pub struct CircuitBuilder<F: RichField + Extendable<D>, const D: usize> {
    pub config: CircuitConfig,

    /// A domain separator, which is included in the initial Fiat-Shamir seed. This is generally not
    /// needed, but can be used to ensure that proofs for one application are not valid for another.
    /// Defaults to the empty vector.
    domain_separator: Option<Vec<F>>,

    /// The types of gates used in this circuit.
    gates: HashSet<GateRef<F, D>>,

    /// The concrete placement of each gate.
    pub(crate) gate_instances: Vec<GateInstance<F, D>>,

    /// Targets to be made public.
    public_inputs: Vec<Target>,

    /// The next available index for a `VirtualTarget`.
    virtual_target_index: usize,

    copy_constraints: Vec<CopyConstraint>,

    /// A tree of named scopes, used for debugging.
    context_log: ContextTree,

    /// Generators used to generate the witness.
    generators: Vec<WitnessGeneratorRef<F, D>>,

    /// maps the constant value -> ConstantTarget(a virtual target)
    constants_to_targets: HashMap<F, Target>,
    /// an inverse map of the constants_to_targets
    targets_to_constants: HashMap<Target, F>,

    /// Memoized results of `arithmetic` calls.
    pub(crate) base_arithmetic_results: HashMap<BaseArithmeticOperation<F>, Target>,

    /// Memoized results of `arithmetic_extension` calls.
    pub(crate) arithmetic_results: HashMap<ExtensionArithmeticOperation<F, D>, ExtensionTarget<D>>,

    /// Map between gate type and the current gate of this type with available slots.
    current_slots: HashMap<GateRef<F, D>, CurrentSlot<F, D>>,

    /// List of constant generators used to fill the constant wires.
    constant_generators: Vec<ConstantGenerator<F>>,

    /// Rows for each LUT: LookupWire contains: first `LookupGate`, first `LookupTableGate`, last `LookupTableGate`.
    lookup_rows: Vec<LookupWire>,

    /// For each LUT index, vector of `(looking_in, looking_out)` pairs.
    lut_to_lookups: Vec<Lookup>,

    // Lookup tables in the form of `Vec<(input_value, output_value)>`.
    luts: Vec<LookupTable>,

    /// Optional common data. When it is `Some(goal_data)`, the `build` function panics if the resulting
    /// common data doesn't equal `goal_data`.
    /// This is used in cyclic recursion.
    pub(crate) goal_common_data: Option<CommonCircuitData<F, D>>,

    /// Optional verifier data that is registered as public inputs.
    /// This is used in cyclic recursion to hold the circuit's own verifier key.
    pub(crate) verifier_data_public_input: Option<VerifierCircuitTarget>,
}
```
- **virtual_target**:  This is not an actual wire in the witness, but just a target that help facilitate witness generation. In particular, a generator can assign a values to a virtual target, which can then be copied to other (virtual or concrete) targets. When we generate the final witness (a grid of wire values), these virtual targets will go away.

### 3.1 methods
```rust
/// Adds a gate to the circuit, and returns its index.
pub fn add_gate<G: Gate<F, D>>(&mut self, gate_type: G, mut constants: Vec<F>) -> usize {}

/// Returns a routable target with the given constant value.
/// for example, for ArithmeticGate, at least constant of `ONE` and `ZERO` is allocated
/// those constant target are all virtual target
pub fn constant(&mut self, c: F) -> Target {
    if let Some(&target) = self.constants_to_targets.get(&c) {
        // We already have a wire for this constant.
        return target;
    }

    let target = self.add_virtual_target();
    self.constants_to_targets.insert(c, target);
    self.targets_to_constants.insert(target, c);

    target
}

/// get polynomial to constants for each gate
/// the size of the vector is the number of constants (a value for the whole circuit, gate selectors + constants for gate inputs)
/// each polynomial interpolates the actual constant value at each gate, 
fn constant_polys(&self) -> Vec<PolynomialValues<F>> {}

/// if zero_knwoledge is set, it will blind the circuit
/// if the number of circuits is not a power of 2, pad NoopGate, and make the total number of gates to be power of 2
fn blind_and_pad(&mut self) {}
/**
  * hash the circuit inputs into m Target, m is a constant value of 4. During this process, a `PoseidonGate` is added as the hashing of inputs is conducted
  * @param inputs: public inputs and private inputs
  */
pub fn hash_n_to_hash_no_pad<H: AlgebraicHasher<F>>(
    &mut self,
    inputs: Vec<Target>,
) -> HashOutTarget {
    HashOutTarget::from_vec(self.hash_n_to_m_no_pad::<H>(inputs, NUM_HASH_OUT_ELTS))
}


/**
  * @param k_is, the coset shift, g^{j}, j \in [0,num_shifts - 1], num_shifts is equal to num_routed_wires (columns); e.q 100
  * @subgroup: the \Omega domain. \Omega^{i}, i \in [0, N-1], N is number of gates (rows); e.q 8 (2^3)
  * @return(0): vector of the sigma polynomial (sigma polynomial is the copy constraint permutation); the size is equal to the number of cols
  * @return(1): the forest is a data structure representing all wires copy constraint. the collected wires forms a unique partition
  */
fn sigma_vecs(&self, k_is: &[F], subgroup: &[F]) -> (Vec<PolynomialValues<F>>, Forest) {}
```

### 3.2 functions
```rust
/// Finds a set of shifts that result in unique cosets for the multiplicative subgroup of size `2^subgroup_bits`.
/// Let `g` be a generator of the entire multiplicative group. the result is just g^0, ..., g^(num_shifts - 1)
pub fn get_unique_coset_shifts<F: Field>(subgroup_size: usize, num_shifts: usize) -> Vec<F> {}
```

## 4. selectors
```rust
/// Selector polynomials are computed as follows:
/// Partition the gates into (the smallest amount of) groups `{ G_i }`, such that for each group `G`
/// `|G| + max_{g in G} g.degree() <= max_degree`. These groups are constructed greedily from
/// the list of gates sorted by degree.
/// We build a selector polynomial `S_i` for each group `G_i`, with
/// S_i\[j\] =
///     if j-th row gate=g_k in G_i
///         k  (k \in [0, NUM_OF_GATE_TYPES)
///     else
///         UNUSED_SELECTOR
/// @param gates: the types of gates , gate type is differentiated by gate.id()
/// @param instances: all instances of gates ( a same type of gate could be used multiple times)
/// @param max_degree: max_degree of each group
/// @return(0): a vector of selector polynomials, the size of the vector is number of groups, in each group, the polynomial indicate which gate type it is
/// @return(1) SelectorsInfo {
///     selector_indices, a vector of gate group information. the size of vector is same to the number of gate types. the value represent which group the gate type belongs to
///     groups: a vector of groups information, the size is the number of groups. in each group, it is a range of the gate types (ordered as a method described above)
/// }
pub(crate) fn selector_polynomials<F: RichField + Extendable<D>, const D: usize>(
    gates: &[GateRef<F, D>],
    instances: &[GateInstance<F, D>],
    max_degree: usize,
) -> (Vec<PolynomialValues<F>>, SelectorsInfo) {}
```

## 5. permutation
```rust
pub struct WirePartition {
    // each element of the vector is a vector of copy constraint
    partition: Vec<Vec<Wire>>,
}

/// Disjoint Set Forest data-structure following <https://en.wikipedia.org/wiki/Disjoint-set_data_structure>.
pub struct Forest {
    /// A map of parent pointers, stored as indices. the parent value is the partition it belongs to
    /// those node with same parent value, means they are in the copy constraint 
    pub(crate) parents: Vec<usize>,

    num_wires: usize,
    num_routed_wires: usize, // num_routed_wires is used to construct all wires
    degree: usize,
}
```

## 6. hash
defined in `CircuitBuilder`
```rust
/// Hash function used for building Merkle trees.
type Hasher: Hasher<Self::F>;
/// Algebraic hash function used for the challenger and hashing public inputs.
type InnerHasher: AlgebraicHasher<Self::F>;

/// Trait for algebraic hash functions, built from a permutation using the sponge construction.
pub trait AlgebraicHasher<F: RichField>: Hasher<F, Hash = HashOut<F>> {
    type AlgebraicPermutation: PlonkyPermutation<Target>;

    /// Circuit to conditionally swap two chunks of the inputs (useful in verifying Merkle proofs),
    /// then apply the permutation.
    fn permute_swapped<const D: usize>(
        inputs: Self::AlgebraicPermutation,
        swap: BoolTarget,
        builder: &mut CircuitBuilder<F, D>,
    ) -> Self::AlgebraicPermutation
    where
        F: RichField + Extendable<D>;
}
```


## 7. IOP
### 7.1 generator
```rust
/// Generator used to fill an extra constant.
#[derive(Debug, Clone, Default)]
pub struct ConstantGenerator<F: Field> {
    pub row: usize,  //  specifying the gate row number
    pub constant_index: usize, // index of constant input. for example, for a constant gate, num_consts is specified; num_consts will specify the total number of constants
    pub wire_index: usize,     // index of constant wire output
    pub constant: F, // the constant used to fill a target
}


/// A generator which runs once after a list of dependencies is present in the witness.
pub trait SimpleGenerator<F: RichField + Extendable<D>, const D: usize>:
    'static + Send + Sync + Debug
{
    fn id(&self) -> String;

    fn dependencies(&self) -> Vec<Target>;

    fn run_once(&self, witness: &PartitionWitness<F>, out_buffer: &mut GeneratedValues<F>);

    fn adapter(self) -> SimpleGeneratorAdapter<F, Self, D>
    where
        Self: Sized,
    {
        SimpleGeneratorAdapter {
            inner: self,
            _phantom: PhantomData,
        }
    }

    fn serialize(&self, dst: &mut Vec<u8>, common_data: &CommonCircuitData<F, D>) -> IoResult<()>;

    fn deserialize(src: &mut Buffer, common_data: &CommonCircuitData<F, D>) -> IoResult<Self>
    where
        Self: Sized;
}
```

## 8. FRI



## Questions
