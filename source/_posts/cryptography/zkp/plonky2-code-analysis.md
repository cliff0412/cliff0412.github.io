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
  num_constants: 2,
  use_base_arithmetic_gate: true,
  security_bits: 100,
  num_challenges: 2,
  zero_knowledge: false,
  max_quotient_degree_factor: 8,
  fri_config: FriConfig {
      rate_bits: 3,
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

    /// maps constant value -> ConstantTarget(a virtual target)
    constants_to_targets: HashMap<F, Target>,
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

## 4. permutation
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

## 5. hash
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






## Questions
- CircuitBuilder: self.constant_generators
- Gate: extra_constant_wires
- Constant Gate
```
    fn eval_unfiltered(&self, vars: EvaluationVars<F, D>) -> Vec<F::Extension> {
        (0..self.num_consts)
            .map(|i| {
                vars.local_constants[self.const_input(i)] - vars.local_wires[self.wire_output(i)]
            })
            .collect()
    }
```