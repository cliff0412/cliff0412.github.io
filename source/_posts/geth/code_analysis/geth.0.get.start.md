---
title: geth start
date: 2022-11-01 18:15:12
tags: [blockchain,geth]
---

## build from source
```
git clone https://github.com/ethereum/go-ethereum.git
cd go-ethereum
make geth
```

## understanding geth config
geth config type is defined in /cmd/geth/config.go
```go
type gethConfig struct {
	Eth      ethconfig.Config
	Node     node.Config
	Ethstats ethstatsConfig
	Metrics  metrics.Config
}
```
- **ethconfig** (eth/ethconfig/config.go)
contains configuration options for of the ETH and LES(light node) protocols, such as NetworkId, SyncMode, txpool.Config, database options
- **nodeConfig** (node/config.go)
represents a small collection of configuration values to fine tune the P2P network layer of a protocol stack. These values can be further extended by all registered services. such as p2p.Config, DataDir, KeyStoreDir, HTTPHost, HTTPModules(eth,net,web3), WSHost
- **metrics.Config** (metrics/config.go)
contains the configuration for the metric collection, such as InfluxDBEndpoint, etc
- **ethstatsConfig**
only one URL entry

geth provides default config in the above files. user config file path is given by the below flag
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

## key configs
- [Eth].TxLookupLimit 
Number of recent blocks to maintain transactions index for (default = about one year, 0 = entire chain), default: 2350000
- [Node].BootstrapNodes
used to establish connectivity with the rest of the network.
geth provides default bootstrapNodes in file `params/bootnodes.go`
- [Metrics_AND_STATS].ethstats
Reporting URL of a ethstats service (nodename:secret@host:port), [more detail](https://geth.ethereum.org/docs/monitoring/ethstats)
- SyncMode
- TrieDirtyCache
- NoPruning
- TrieCleanCacheJournal e.g triecache
## how geth starts

![geth starts](/images/geth_starts.drawio.png)
the main func is in `cmd/geth/main.go`
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
geth is the main entry point into the system if no special subcommand is run. It creates a default node based on the command line arguments and runs it in blocking mode, waiting for it to be shut down.
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

### prepare
The implementation of the prepare() function is in the current main.go file. It is mainly used to set some configurations required for node initialization.

### makeFullNode
The implementation of the `makeFullNode()` function is located in the `cmd/geth/config.go` file. It will load the context of the command and apply user given configuration; and generate instances of `stack` and `backend`. Among them, `stack` is an instance of `Node` type (Node is the top-level instance in the life cycle of geth. It is responsible for managing high-level abstractions such as P2P Server, Http Server, and Database in the node. The definition of the Node type is located in the `node/node.go` file), which is initialized by calling `makeConfigNode()` function through `makeFullNode()` function. inside `makeFullNode`, it calls `node.New(&cfg.Node)` to initiate a node. During instantiating of node, it invokes `rpc.NewServer()` to create a new rpc server and put in the field `inprocHandler`. it registers `rpc` api namespace by default.

The `backend` here is an interface of `ethapi.Backend` type, which provides the basic functions needed to obtain the runtime of the Ethereum execution layer. Its definition is located in `internal/ethapi/backend.go`. Since there are many functions in this interface, we have selected some of the key functions as below for a glimpse of its functionality. `backend` is created by calling `backend, eth := utils.RegisterEthService(stack, &cfg.Eth)`. Inside, it calls `eth.New(stack, cfg)` to create `backend` instance. During `backend` initiating, it opens database (`chainDb, err := stack.OpenDatabaseWithFreezer("chaindata", config.DatabaseCache, config.DatabaseHandles, config.DatabaseFreezer, "eth/db/chaindata/", false)`). Further, it creates consensus engine, `engine := ethconfig.CreateConsensusEngine(stack, &ethashConfig, cliqueConfig, config.Miner.Notify, config.Miner.Noverify, chainDb)`. goerli testnet use POA consensus (clique). 
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

### startNode
The last key function, `startNode()`, is to officially start an Ethereum execution layer node. It starts the Stack instance (Node) by calling the utils.StartNode() function which triggers the Node.Start() function. In the Node.Start() function, it traverses the backend instances registered in `Node.lifecycles` and starts them. In addition, in the startNode() function, the unlockAccounts() function is still called, and the unlocked wallet is registered in the stack, and the RPClient module that interacts with local Geth is created through the stack.Attach() function

At the end of the geth() function, the function executes `stack.Wait()`, so that the main thread enters the blocking state, and the services of other functional modules are distributed to other sub-coroutines for maintenance

## Node
As we mentioned earlier, the Node type belongs to the top-level instance in the life cycle of geth, and it is responsible for being the administrator of the high-level abstract module communicating with the outside world, such as managing rpc server, http server, Web Socket, and P2P Server external interface . At the same time, Node maintains the back-end instances and services (lifecycles []Lifecycle) required for node operation, such as the Ethereum type we mentioned above that is responsible for the specific Service
```go
type Node struct {
	eventmux      *event.TypeMux
	config        *Config
	accman        *accounts.Manager
	log           log.Logger
	keyDir        string        // key store directory
	keyDirTemp    bool          // If true, key directory will be removed by Stop
	dirLock       *flock.Flock  // prevents concurrent use of instance directory
	stop          chan struct{} // Channel to wait for termination notifications
	server        *p2p.Server   // Currently running P2P networking layer
	startStopLock sync.Mutex    // Start/Stop are protected by an additional lock
	state         int           // Tracks state of node lifecycle

	lock          sync.Mutex
	lifecycles    []Lifecycle // All registered backends, services, and auxiliary services that have a lifecycle
	rpcAPIs       []rpc.API   // List of APIs currently provided by the node
	http          *httpServer //
	ws            *httpServer //
	httpAuth      *httpServer //
	wsAuth        *httpServer //
	ipc           *ipcServer  // Stores information about the ipc http server
	inprocHandler *rpc.Server // In-process RPC request handler to process the API requests

	databases map[*closeTrackingDB]struct{} // All open databases
}
```

### close node
As mentioned earlier, the main thread of the entire program is blocked because of calling `stack.Wait()`. We can see that a channel called `stop` is declared in the Node structure. Since this Channel has not been assigned a value, the main process of the entire geth enters the blocking state, and continues to execute other business coroutines concurrently
```go
// Wait blocks until the node is closed.
func (n *Node) Wait() {
 <-n.stop
}
```
When the Channel n.stop is assigned a value, the geth main function will stop the current blocking state and start to perform a series of corresponding resource release operations.
It is worth noting that in the current codebase of go-ethereum, the blocking state of the main process is not ended directly by assigning a value to the stop channel, but a more concise and rude way is used: call the close() function directly Close the Channel. We can find the related implementation in node.doClose(). close() is a native function of go language, used when closing Channel.
```go
// doClose releases resources acquired by New(), collecting errors.
func (n *Node) doClose(errs []error) error {
 // Close databases. This needs the lock because it needs to
 // synchronize with OpenDatabase*.
 n.lock.Lock()
 n.state = closedState
 errs = append(errs, n.closeDatabases()...)
 n.lock.Unlock()

 if err := n.accman.Close(); err != nil {
  errs = append(errs, err)
 }
 if n.keyDirTemp {
  if err := os.RemoveAll(n.keyDir); err != nil {
   errs = append(errs, err)
  }
 }

 // Release instance directory lock.
 n.closeDataDir()

 // Unblock n.Wait.
 close(n.stop)

 // Report any errors that might have occurred.
 switch len(errs) {
 case 0:
  return nil
 case 1:
  return errs[0]
 default:
  return fmt.Errorf("%v", errs)
 }
}
```

## Ethereum Backend
We can find the definition of the Ethereum structure in eth/backend.go. The member variables and receiving methods contained in this structure implement all the functions and data structures required by an Ethereum full node. We can see in the following code definition that the Ethereum structure contains several core data structures such as TxPool, Blockchain, consensus.Engine, and miner as member variables.
```go
type Ethereum struct {
	config *ethconfig.Config

	// Handlers
	txPool             *txpool.TxPool
	blockchain         *core.BlockChain
	handler            *handler
	ethDialCandidates  enode.Iterator
	snapDialCandidates enode.Iterator
	merger             *consensus.Merger

	// DB interfaces
	chainDb ethdb.Database // Block chain database

	eventMux       *event.TypeMux
	engine         consensus.Engine
	accountManager *accounts.Manager

	bloomRequests     chan chan *bloombits.Retrieval // Channel receiving bloom data retrieval requests
	bloomIndexer      *core.ChainIndexer             // Bloom indexer operating during block imports
	closeBloomHandler chan struct{}

	APIBackend *EthAPIBackend

	miner     *miner.Miner
	gasPrice  *big.Int
	etherbase common.Address

	networkID     uint64
	netRPCService *ethapi.NetAPI

	p2pServer *p2p.Server

	lock sync.RWMutex // Protects the variadic fields (e.g. gas price and etherbase)

	shutdownTracker *shutdowncheck.ShutdownTracker // Tracks if and when the node has shutdown ungracefully
}
```
Nodes start and stop Mining by calling `Ethereum.StartMining()` and `Ethereum.StopMining()`. Setting the profit account of Mining is achieved by calling `Ethereum.SetEtherbase()`
Here we pay extra attention to the member variable `handler`. The definition of `handler` is in `eth/handler.go`.
From a macro point of view, the main workflow of a node needs to: 1. Obtain/synchronize Transaction and Block data from the network 2. Add the Block obtained from the network to the Blockchain. The handler is responsible for providing the function of synchronizing blocks and transaction data, for example, `downloader.Downloader` is responsible for synchronizing Block from the network, and `fetcher.TxFetcher` is responsible for synchronizing transactions from the network