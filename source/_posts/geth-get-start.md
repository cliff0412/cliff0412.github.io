---
title: geth.get.start
date: 2023-02-02 18:15:12
tags:
---

# build from source
```
git clone https://github.com/ethereum/go-ethereum.git
cd go-ethereum
make geth
```

# understanding geth config
geth config type is defined in /cmd/geth/config.go
```go
type gethConfig struct {
	Eth      ethconfig.Config
	Node     node.Config
	Ethstats ethstatsConfig
	Metrics  metrics.Config
}
```
- ethconfig (eth/ethconfig/config.go)
contains configuration options for of the ETH and LES protocols, such as NetworkId, SyncMode, txpool.Config, database options
- nodeConfig (node/config.go)
represents a small collection of configuration values to fine tune the P2P network layer of a protocol stack. These values can be further extended by all registered services. such as p2p.Config, DataDir, KeyStoreDir, HTTPHost, HTTPModules(eth,net,web3), WSHost
- metrics.Config (metrics/config.go)
contains the configuration for the metric collection, such as InfluxDBEndpoint, etc
- ethstatsConfig

geth provides default config in the above files. user config file path is given be the below flag
```go
configFileFlag = &cli.StringFlag{
		Name:     "config",
		Usage:    "TOML configuration file",
		Category: flags.EthCategory,
	}
```

The config file should be a .toml file. A convenient way to create a config file is to get Geth to create one for you and use it as a template. To do this, use the dumpconfig command, saving the result to a .toml file. Note that you also need to explicitly provide the network_id on the command line for the public testnets such as Sepolia or Geoerli:
```
./geth --sepolia dumpconfig > geth-config.toml
```
to specify path to config file
```
geth --sepolia --config geth-config.toml
```

# how geth starts
the main func is in cmd/geth/main.go
```go
func main() {
	if err := app.Run(os.Args); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
```
the main() function is very short, and its main function is to start a tool for parsing command line commands: `gopkg.in/urfave/cli.v1`. Going deeper, we will find that `app.Action = geth` will be called when the cli app is initialized to call the geth() function
```go
func init() {
	// Initialize the CLI app and start Geth
	app.Action = geth
    // ....
}
```
geth is the main entry point into the system if no special subcommand is run.
It creates a default node based on the command line arguments and runs it in
blocking mode, waiting for it to be shut down.
```go
func geth(ctx *cli.Context) error {
	if args := ctx.Args().Slice(); len(args) > 0 {
		return fmt.Errorf("invalid command: %q", args[0])
	}

	prepare(ctx)
	stack, backend := makeFullNode(ctx)
	defer stack.Close()

	startNode(ctx, stack, backend, false)
	stack.Wait()
	return nil
}
```
In the geth() function, there are three important function calls, namely: `prepare()`, `makeFullNode()`, and `startNode()`.

The implementation of the prepare() function is in the current main.go file. It is mainly used to set some configurations required for node initialization.

The implementation of the makeFullNode() function is located in the cmd/geth/config.go file. It will load the context of the command when Geth starts into the configuration, and generate two instances of `stack` and `backend`. Among them, stack is an instance of `Node` type, which is initialized by calling `makeConfigNode()` function through `makeFullNode()` function. Node is the top-level instance in the life cycle of geth. It is responsible for managing high-level abstractions such as P2P Server, Http Server, and Database in the node. The definition of the Node type is located in the node/node.go file.

The `backend` here is an interface of `ethapi.Backend` type, which provides the basic functions needed to obtain the runtime of the Ethereum execution layer. Its definition is located in internal/ethapi/backend.go. Since there are many functions in this interface, we have selected some of the key functions so that everyone can understand the basic functions provided by this interface, as shown below
```go
type Backend interface {
	SyncProgress() ethereum.SyncProgress
	SuggestGasTipCap(ctx context.Context) (*big.Int, error)
	ChainDb() ethdb.Database
	AccountManager() *accounts.Manager
	ExtRPCEnabled() bool
	RPCGasCap() uint64            // global gas cap for eth_call over rpc: DoS protection
	RPCEVMTimeout() time.Duration // global timeout for eth_call over rpc: DoS protection
	RPCTxFeeCap() float64         // global tx fee cap for all transaction related APIs
	UnprotectedAllowed() bool     // allows only for EIP155 transactions.
	SetHead(number uint64)
	HeaderByNumber(ctx context.Context, number rpc.BlockNumber) (*types.Header, error)
	HeaderByHash(ctx context.Context, hash common.Hash) (*types.Header, error)
	HeaderByNumberOrHash(ctx context.Context, blockNrOrHash rpc.BlockNumberOrHash) (*types.Header, error)
	CurrentHeader() *types.Header
	CurrentBlock() *types.Header
	BlockByNumber(ctx context.Context, number rpc.BlockNumber) (*types.Block, error)
	BlockByHash(ctx context.Context, hash common.Hash) (*types.Block, error)
	BlockByNumberOrHash(ctx context.Context, blockNrOrHash rpc.BlockNumberOrHash) (*types.Block, error)
	StateAndHeaderByNumber(ctx context.Context, number rpc.BlockNumber) (*state.StateDB, *types.Header, error)
	StateAndHeaderByNumberOrHash(ctx context.Context, blockNrOrHash rpc.BlockNumberOrHash) (*state.StateDB, *types.Header, error)
	PendingBlockAndReceipts() (*types.Block, types.Receipts)
	GetReceipts(ctx context.Context, hash common.Hash) (types.Receipts, error)
	GetTd(ctx context.Context, hash common.Hash) *big.Int
	GetEVM(ctx context.Context, msg *core.Message, state *state.StateDB, header *types.Header, vmConfig *vm.Config) (*vm.EVM, func() error, error)
	SubscribeChainEvent(ch chan<- core.ChainEvent) event.Subscription
	SubscribeChainHeadEvent(ch chan<- core.ChainHeadEvent) event.Subscription
	SubscribeChainSideEvent(ch chan<- core.ChainSideEvent) event.Subscription
	SendTx(ctx context.Context, signedTx *types.Transaction) error
	GetTransaction(ctx context.Context, txHash common.Hash) (*types.Transaction, common.Hash, uint64, uint64, error)
	GetPoolTransactions() (types.Transactions, error)
	GetPoolTransaction(txHash common.Hash) *types.Transaction
	GetPoolNonce(ctx context.Context, addr common.Address) (uint64, error)
	Stats() (pending int, queued int)
	TxPoolContent() (map[common.Address]types.Transactions, map[common.Address]types.Transactions)
	TxPoolContentFrom(addr common.Address) (types.Transactions, types.Transactions)
	SubscribeNewTxsEvent(chan<- core.NewTxsEvent) event.Subscription
	ChainConfig() *params.ChainConfig
	Engine() consensus.Engine
	GetBody(ctx context.Context, hash common.Hash, number rpc.BlockNumber) (*types.Body, error)
	GetLogs(ctx context.Context, blockHash common.Hash, number uint64) ([][]*types.Log, error)
	SubscribeRemovedLogsEvent(ch chan<- core.RemovedLogsEvent) event.Subscription
	SubscribeLogsEvent(ch chan<- []*types.Log) event.Subscription
	SubscribePendingLogsEvent(ch chan<- []*types.Log) event.Subscription
	BloomStatus() (uint64, uint64)
	ServiceFilter(ctx context.Context, session *bloombits.MatcherSession)
}
```

If readers want to customize some new RPC APIs, they can define functions in the /internal/ethapi.Backend interface and add specific implementations to EthAPIBackend