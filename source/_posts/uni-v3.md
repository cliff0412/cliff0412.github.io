---
title: a deep dive into uniswap v3
date: 2024-11-19 17:22:25
tags: [defi, math]
---

<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

## concentrated liquidity
recap on AMM. the price of asset X is defined as  
\\[ \tag{1}
P = y/x
\\]

where y is asset quantity of asset Y, and x is asset quantity of X.
since
\\[ \tag{2}
L^{2} = x*y
\\]
where \\(L\\) is the liquidity, and \\(L^2=k\\)

divide E.q.(2) by E.q.(1), we get
\begin{equation} \label{eq:3}
L/\sqrt{P} = x
\end{equation}

multiply E.q.(2) with E.q.(1), we get
\begin{equation} \label{eq:4}
L*\sqrt{P} = y
\end{equation}
![virtual reserves](images/defi/uni_v3_virtual_reserves.jpg)

at point a, we have
$$ L \cdot \sqrt{P_{a}} = y_{a} $$
at point b, we have 
\\[L/\sqrt{P_{b}} = x_{b}\\]
at point c, we have
\begin{equation}
(x_{b} + x_{real}) * (y_{a}+y_{real}) = L^2
\end{equation}
then, we get
\begin{equation}
(L/\sqrt{P_{b}} + x_{real}) * (L*\sqrt{P_{a}}+y_{real}) = L^2
\end{equation}
which is E.q(2.2) in the original uni-v3 white paper

alternatively, liquidity can be thought of as the amount that token1(Y) reserves (either actual or virtual) changes for a given change in \\(\sqrt{P}\\)
\begin{equation}
L =  \frac{\Delta Y}{\Delta\sqrt{P}} 
\end{equation}

The global state also tracks the current tick index as tick $tick(i_{c})$, a signed integer representing the current tick (more specifically, the nearest tick below the current price)
specifically, at any given time, the following equation should be true:
\begin{equation}
i_{c} =  \lfloor{log_{\sqrt{1.0001}}\sqrt{P}}\rfloor 
\end{equation}

The global state also tracks two numbers: $feeGrowthGlobal0(f_{g,0})$ and $feeGrowthGlobal1(f_{g,1})$. These represent the total amount of fees that have been earned per unit of virtual liquidity $L$, over the entire history of the contract

Each tick tracks $\Delta L$, the total amount of liquidity that should be kicked in or out when the tick is crossed. The tick only needs to track one signed integer: the amount of liquidity added (or, if negative, removed) when the tick is crossed going left to right. This value does not need to be updated when the tick is crossed (but only when a position with a bound at that tick is updated)