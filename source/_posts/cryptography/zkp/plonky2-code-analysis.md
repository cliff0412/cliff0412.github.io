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

## 0. field
the lde in proving stage is conducted on extension field
```rust
pub trait Field {
/// The 2-adicity of this field's multiplicative group. a two-adicity of 32 means that there's a multiplicative subgroup of size 2^32 that exists in the field.
const TWO_ADICITY: usize;

// Sage:
// ```
// g_2 = g^((p - 1) / 2^32)
// g_2.multiplicative_order().factor()
// ```
const POWER_OF_TWO_GENERATOR: Self = Self(1753635133440165772);  // POWER_OF_TWO_GENERATOR^{2^32} = 1

}

impl Field for GoldilocksField {

    const TWO_ADICITY: usize = 32;

    // Sage: `g = GF(p).multiplicative_generator()`
    const MULTIPLICATIVE_GROUP_GENERATOR: Self = Self(7);

    // Sage:
    // ```
    // g_2 = g^((p - 1) / 2^32)
    // g_2.multiplicative_order().factor()
    // ```
    const POWER_OF_TWO_GENERATOR: Self = Self(1753635133440165772);
}

pub trait FieldExtension<const D: usize>: Field {
    type BaseField: Field;

    fn to_basefield_array(&self) -> [Self::BaseField; D];

    fn from_basefield_array(arr: [Self::BaseField; D]) -> Self;
}

pub struct QuadraticExtension<F: Extendable<2>>(pub [F; 2]);
impl<F: Extendable<2>> FieldExtension<2> for QuadraticExtension<F> {}

/// Optimal extension field trait.
/// A degree `d` field extension is optimal if there exists a base field element `W`,
/// such that the extension is `F[X]/(X^d-W)`.
#[allow(clippy::upper_case_acronyms)]
pub trait OEF<const D: usize>: FieldExtension<D> {
    // Element W of BaseField, such that `X^d - W` is irreducible over BaseField.
    const W: Self::BaseField;

    // Element of BaseField such that DTH_ROOT^D == 1. Implementors
    // should set this to W^((p - 1)/D), where W is as above and p is
    // the order of the BaseField.
    const DTH_ROOT: Self::BaseField;
}


pub trait Extendable<const D: usize>: Field + Sized {
    type Extension: Field + OEF<D, BaseField = Self> + Frobenius<D> + From<Self>;

    const W: Self;

    const DTH_ROOT: Self;  // D-th root

    /// Chosen so that when raised to the power `(p^D - 1) >> F::Extension::TWO_ADICITY)`
    /// we obtain F::EXT_POWER_OF_TWO_GENERATOR.
    const EXT_MULTIPLICATIVE_GROUP_GENERATOR: [Self; D];

    /// Chosen so that when raised to the power `1<<(Self::TWO_ADICITY-Self::BaseField::TWO_ADICITY)`,
    /// we get `Self::BaseField::POWER_OF_TWO_GENERATOR`. This makes `primitive_root_of_unity` coherent
    /// with the base field which implies that the FFT commutes with field inclusion.
    const EXT_POWER_OF_TWO_GENERATOR: [Self; D];
}

impl Extendable<2> for GoldilocksField {
    type Extension = QuadraticExtension<Self>;

    // Verifiable in Sage with
    // `R.<x> = GF(p)[]; assert (x^2 - 7).is_irreducible()`.
    const W: Self = Self(7);

    // DTH_ROOT = W^((ORDER - 1)/2), DTH_ROOT^D = 1
    const DTH_ROOT: Self = Self(18446744069414584320);

    const EXT_MULTIPLICATIVE_GROUP_GENERATOR: [Self; 2] =
        [Self(18081566051660590251), Self(16121475356294670766)];

    const EXT_POWER_OF_TWO_GENERATOR: [Self; 2] = [Self(0), Self(15659105665374529263)]; // EXT_POWER_OF_TWO_GENERATOR^{2^32} = 1
}

impl Mul for QuadraticExtension<GoldilocksField> {
    #[inline]
    fn mul(self, rhs: Self) -> Self {
        let Self([a0, a1]) = self;
        let Self([b0, b1]) = rhs;
        let c = ext2_mul([a0.0, a1.0], [b0.0, b1.0]);
        Self(c)
    }
}

/// Let `F_D` be the optimal extension field `F[X]/(X^D-W)`. Then `ExtensionAlgebra<F_D>` is the quotient `F_D[X]/(X^D-W)`.
/// It's a `D`-dimensional algebra over `F_D` useful to lift the multiplication over `F_D` to a multiplication over `(F_D)^D`.
#[derive(Copy, Clone)]
pub struct ExtensionAlgebra<F: OEF<D>, const D: usize>(pub [F; D]);  // F is extension field composing D base Fields, [F; D] is an array of F, with size D


impl<F: OEF<D>, const D: usize> ExtensionAlgebra<F, D> {
    /// mul extension field wiht a base field
     pub fn scalar_mul(&self, scalar: F) -> Self {
        let mut res = self.0;
        res.iter_mut().for_each(|x| {
            *x *= scalar;
        });
        Self(res)
    }
}

// implement the multiplciation of two extension field
impl<F: OEF<D>, const D: usize> Mul for ExtensionAlgebra<F, D> {
    type Output = Self;

    #[inline]
    fn mul(self, rhs: Self) -> Self {
        let mut res = [F::ZERO; D];
        let w = F::from_basefield(F::W);
        for i in 0..D {
            for j in 0..D {
                res[(i + j) % D] += if i + j < D {
                    self.0[i] * rhs.0[j]
                } else {
                    w * self.0[i] * rhs.0[j]
                }
            }
        }
        Self(res)
    }
}






```

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
### 2.1 ArithmeticGate
```rust
/// A gate which can perform a weighted multiply-add, i.e. `result = c0 x y + c1 z`. If the config
/// supports enough routed wires, it can support several such operations in one gate.
pub struct ArithmeticGate {
    /// Number of arithmetic operations performed by an arithmetic gate.
    pub num_ops: usize,
}
```
- num_constants = 2
- degree = 3 ( three inputs)
- num_constraints = num_ops, default 20

### 2.2 PodeidonGate
All pubic inputs are hashed into 4 Hash Output. Therefore, PoseidonGate is required
```rust
/// Evaluates a full Poseidon permutation with 12 state elements.
///
/// This also has some extra features to make it suitable for efficiently verifying Merkle proofs.
/// It has a flag which can be used to swap the first four inputs with the next four, for ordering
/// sibling digests.
#[derive(Debug, Default)]
pub struct PoseidonGate<F: RichField + Extendable<D>, const D: usize>(PhantomData<F>);
```

### 2.2 ConstantGate 
```rust
/// A gate which takes a single constant parameter and outputs that value.
/// For example, constant `ONE` and `ZERO` is allocated for ArithmeticGate, then two constant generators are required if such ArithmeticGate is allocated. The ArithmeticGate only hold wires for multiplicant_1 multiplicant_2, addent, and output. the constants used is held in ConstantGate
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
```
- `num_constants` (a configured value `num_consts`)
- `degree` = 1 ( one inputs)
- `num_constraints` = `num_constants`

### 2.3 PublicInputGate
```rust
/// A gate whose first four wires will be equal to a hash of public inputs. the value 4 is hadcoded as the hash
/// out inputs is 4 Targets. PublicInputGate is aliased as pi gate
pub struct PublicInputGate;
impl PublicInputGate {
    pub fn wires_public_inputs_hash() -> Range<usize> {
        0..4
    }
}
```
- `num_constants` =0
- `degree` = 1
- `num_constraints` = 4

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
/// Returns the selector polynomials and related information.
///
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
///
/// the reason is to reduce degrees of selector polynomial * trace polynoial (trace polynomial's degree in each group is bounded by max_degree)
/// @param gates: the types of gates , gate type is differentiated by gate.id()
/// @param instances: all instances of gates ( a same type of gate could be used multiple times)
/// @param max_degree: max_degree of each group
/// @return(0): a vector of selector polynomials, the size of the vector is number of groups, in each group, the polynomial indicate the gate_type (k value) of each gate_instance. Hence, the degree of each polynomial is the total number of gate instances (a power of 2)
/// @return(1) SelectorsInfo {
///     selector_indices, a vector of gate group information. the size of vector is same to the number of gate types. the value indicate which group the gate_type belongs to
///     groups: a vector of group information, the vector size is the number of groups. in each group, it is a range of the gate types (ordered as the method described above. i.e partition gates in to groups based on the rule about their degrees)
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
/// A generator which runs once after a list of dependencies is present in the witness.
pub trait SimpleGenerator<F: RichField + Extendable<D>, const D: usize>:
    'static + Send + Sync + Debug
{
    fn id(&self) -> String;

    fn dependencies(&self) -> Vec<Target>;

    /**
     * @param out_buffer, contains the vector of a tuple (output_target, output_value)
     */
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

pub struct SimpleGeneratorAdapter<
    F: RichField + Extendable<D>,
    SG: SimpleGenerator<F, D> + ?Sized,
    const D: usize,
> {
    _phantom: PhantomData<F>,
    inner: SG,
}

impl<F: RichField + Extendable<D>, SG: SimpleGenerator<F, D>, const D: usize> WitnessGenerator<F, D>
    for SimpleGeneratorAdapter<F, SG, D>
{
    fn watch_list(&self) -> Vec<Target> {
        self.inner.dependencies()
    }

    fn run(&self, witness: &PartitionWitness<F>, out_buffer: &mut GeneratedValues<F>) -> bool {
        if witness.contains_all(&self.inner.dependencies()) {
            self.inner.run_once(witness, out_buffer);
            true
        } else {
            false
        }
    }
}

/// Generator used to fill an extra constant.
#[derive(Debug, Clone, Default)]
pub struct ConstantGenerator<F: Field> {
    pub row: usize,  //  specifying the gate row number
    pub constant_index: usize, // index of constant input. for example, for a constant gate, num_consts is specified; num_consts will specify the total number of constants
    pub wire_index: usize,     // index of constant wire output
    pub constant: F, // the constant used to fill a target
}

pub struct RandomValueGenerator {
    pub(crate) target: Target,  // the target holding a random value
}

pub struct ArithmeticBaseGenerator<F: RichField + Extendable<D>, const D: usize> {
    row: usize,
    const_0: F,
    const_1: F,
    i: usize, // column
}

pub struct PoseidonGenerator<F: RichField + Extendable<D> + Poseidon, const D: usize> {
    row: usize,
    _phantom: PhantomData<F>,
}
```


### 7.2 target
```rust
/// A location in the witness.
#[derive(Copy, Clone, Eq, PartialEq, Hash, Debug, Serialize, Deserialize)]
pub enum Target {
    Wire(Wire),
    /// A target that doesn't have any inherent location in the witness (but it can be copied to
    /// another target that does). This is useful for representing intermediate values in witness
    /// generation.
    VirtualTarget {
        index: usize,
    },
}

impl Target {
    /// degree is the number of gates, num_wires is the total number or wires of a gate (one gate could have multiple operations)
    /// num_wires is different from num_routed_wires, num_wires include those not routable wires.
    pub fn index(&self, num_wires: usize, degree: usize) -> usize {
        match self {
            Target::Wire(Wire { row, column }) => row * num_wires + column,
            Target::VirtualTarget { index } => degree * num_wires + index,  // virtual target could be the public & private input, 
        }
    }
}

pub struct BoolTarget {
    pub target: Target,
    /// This private field is here to force all instantiations to go through `new_unsafe`.
    _private: (),
}

pub struct Wire {
    /// Row index of the wire.
    pub row: usize,
    /// Column index of the wire.
    pub column: usize,
}
impl Wire {
    // a wire is routable means it could be connected to other gate's wire
    pub fn is_routable(&self, config: &CircuitConfig) -> bool {
        self.column < config.num_routed_wires
    }
}
```

### 7.3 witness
A witness holds information on the values of targets in a circuit.
```rust
/// `PartitionWitness` holds a disjoint-set forest of the targets respecting a circuit's copy constraints.
/// The value of a target is defined to be the value of its root in the forest.
pub struct PartitionWitness<'a, F: Field> {
    pub values: Vec<Option<F>>,  // vector index is target index in the circuit, value is the target value
    pub representative_map: &'a [usize],  // array index is target index, value is the representative target index
    pub num_wires: usize,
    pub degree: usize,
}
```

## 8. Prover
```rust
pub struct ProverOnlyCircuitData<
    F: RichField + Extendable<D>,
    C: GenericConfig<D, F = F>,
    const D: usize,
> {
    pub generators: Vec<WitnessGeneratorRef<F, D>>, // list of generators
    /// Generator indices (within the `Vec` above), indexed by the representative of each target
    /// they watch. key is generator index (as in self.generators), value is the target to watch
    pub generator_indices_by_watches: BTreeMap<usize, Vec<usize>>,
    /// Commitments to the constants polynomials and sigma polynomials.
    pub constants_sigmas_commitment: PolynomialBatch<F, C, D>,
    /// The transpose of the list of sigma polynomials.
    pub sigmas: Vec<Vec<F>>,
    /// Subgroup of order `degree`.
    pub subgroup: Vec<F>,
    /// Targets to be made public.
    pub public_inputs: Vec<Target>,
    /// A map from each `Target`'s index to the index of its representative in the disjoint-set
    /// forest.
    pub representative_map: Vec<usize>,
    /// Pre-computed roots for faster FFT.
    pub fft_root_table: Option<FftRootTable<F>>,
    /// A digest of the "circuit" (i.e. the instance, minus public inputs), which can be used to
    /// seed Fiat-Shamir.
    pub circuit_digest: <<C as GenericConfig<D>>::Hasher as Hasher<F>>::Hash,
    ///The concrete placement of the lookup gates for each lookup table index.
    pub lookup_rows: Vec<LookupWire>,
    /// A vector of (looking_in, looking_out) pairs for for each lookup table index.
    pub lut_to_lookups: Vec<Lookup>,
}
```



## Questions
