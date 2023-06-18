---
title: rpc
date: 2022-11-08 14:23:08
tags: [blockchain, geth]
---


## overview
package rpc implements bi-directional JSON-RPC 2.0 on multiple transports (http, ws, ipc). After creating a server or client instance, objects can be registered to make them visible as 'services'. Exported methods that follow specific conventions can be called remotely. It also has support for the publish/subscribe pattern.

## methods
### rpc endpoints (callback)
Methods that satisfy the following criteria are made available for remote access:
  - method must be exported
  - method returns 0, 1 (response or error) or 2 (response and error) values

The server offers the ServeCodec method which accepts a ServerCodec instance. It will read requests from the codec, process the request and sends the response back to the client using the codec. The server can execute requests concurrently. Responses can be sent back to the client out of order.

An example server which uses the JSON codec:
```go
type CalculatorService struct {}

func (s *CalculatorService) Add(a, b int) int {
    return a + b
}

func (s *CalculatorService) Div(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("divide by zero")
    }
    return a/b, nil
}

calculator := new(CalculatorService)
server := NewServer()
server.RegisterName("calculator", calculator)
l, _ := net.ListenUnix("unix", &net.UnixAddr{Net: "unix", Name: "/tmp/calculator.sock"})
server.ServeListener(l)
```

### subscriptions
The package also supports the publish subscribe pattern through the use of subscriptions.
A method that is considered eligible for notifications must satisfy the following
criteria:
  - method must be exported
  - first method argument type must be context.Context
  - method must have return types (rpc.Subscription, error)

An example method:
```go
func (s *BlockChainService) NewBlocks(ctx context.Context) (rpc.Subscription, error) {
		...
	}
```

### Reverse Calls
In any method handler, an instance of rpc.Client can be accessed through the `ClientFromContext` method. Using this client instance, server-to-client method calls can be performed on the RPC connection.

## server
to start rpc service, the invoking chain is as below
```
node/node.go[func (n *Node) Start()] -> node/node.go[func (n *Node) openEndpoints()] -> node/node.go[func (n *Node) startRPC()]
```

### API registration
