---
title: fourier_series
date: 2023-10-12 11:13:17
tags:
---

<script
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"
  type="text/javascript">
</script>

## Fourier Series
### innter product of two functions
\\[ <f(x), g(x)> = \int_{a}^{b} f(x) \bar{g}(x)dx\\]
\\(\bar{g}\\) is the congugate of g on complex number system

### Fourier series definition
let \\(f(x)\\) be a periodic function over a period of \\([-\pi, +\pi]\\)
![f(x)](/images/math/fourier_series/f_x.png)

\\( f(x) \\) can be transformed into below
\\[ f(x) = \frac{A_{0}}{2} + \sum_{k=1}^{\infty}A_{k}cos(kx) + B_{k}sin(kx)\\],
where
\\[ A_{k} = \frac{1}{\pi} \int_{-\pi}^{+\pi} f(x)cos(kx)dx = \frac{1}{||cos(kx)||^2}<f(x),cos(kx)> \\]
\\[ B_{k} = \frac{1}{\pi} \int_{-\pi}^{+\pi} f(x)sin(kx)dx = \frac{1}{||sin(kx)||^2}<f(x),sin(kx)> \\]
where \\(A_{k}, B_{k}\\) is the projection of \\(f(x)\\) over \\(sin(kx)\\), or \\(cos(kx)\\)

### if period is L
\\[ f(x) = \frac{A_{0}}{2} + \sum_{k=1}^{\infty}A_{k}cos(\frac{2\pi kx}{L}) + B_{k}sin(\frac{2\pi kx}{L})\\],
where 
\\[ A_{k} = \frac{2}{L} \int_{0}^{L} f(x)cos(\frac{2\pi kx}{L})dx\\]
\\[ B_{k} = \frac{2}{L} \int_{0}^{L} f(x)sin(\frac{2\pi kx}{L})dx\\]

## Complex Fourier Series
todo!()

## Discrete Fourier Transform (DFT)
The discrete Fourier transform transforms a sequence of N complex numbers 
\\[\lbrace x_{n} \rbrace := x_0, x_1,..., x_{N-1} \\] into another sequence of complex numbers, 
\\[\lbrace X_{k} \rbrace := X_0, X_1,..., X_{N-1} \\] which is defined by
\\[X_{k} = \sum_{n=0}^{N-1} x_{n} \cdot e^{-\frac{i2\pi}{N}kn}\\]

### inverse DFT
The inverse transform is given by
\\[x_{n} = \frac{1}{N}\sum_{k=0}^{N-1} X_{k} \cdot e^{\frac{i2\pi}{N}kn}\\]


### the unitary DFT
Another way of looking at the DFT is to note that the DFT can be expressed as the DFT matrix, a Vandermonde matrix, introduced by Sylvester in 1867.
\\[
    \boldsymbol{F} =
\begin{bmatrix}
\displaylines{
    \omega_{N}^{0\cdot0}   & \omega_{N}^{0\cdot1}   & \dots  & \omega_{N}^{0\cdot (N-1)}\\\\
    \omega_{N}^{1\cdot0}   & \omega_{N}^{1\cdot1}   & \dots  & \omega_{N}^{2\cdot (N-1)}\\\\
    \vdots                 & \vdots                 & \ddots & \vdots\\\\
    \omega_{N}^{N-1\cdot0} & \omega_{N}^{N-1\cdot1} & \dots  & \omega_{N}^{N-1\cdot (N-1)}
}
\end{bmatrix}
\\]
where \\( \omega_{N} = e^{-\frac{i2\pi}{N}}\\) is a primitive Nth root of unity. (any complex number that yields 1 when raised to some positive integer power n)

\\[  \tag{1.1} X = F \cdot x^{T}\\]

## Fast Fourier Transform (FFT)
FFT is an algorithm to compute DFT ,E.q(1.1). The original DFT contains \\(N^2\\) multiplications. However, FFT reduce it to \\(N\cdot log(N)\\)
