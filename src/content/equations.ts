export const TEX = {
  lswe: [
    String.raw`\frac{\partial \eta}{\partial t} + \frac{1}{R\cos\varphi}\left[\frac{\partial M}{\partial \lambda} + \frac{\partial (N\cos\varphi)}{\partial \varphi}\right] = 0`,
    String.raw`\frac{\partial M}{\partial t} + \frac{g h}{R\cos\varphi}\frac{\partial \eta}{\partial \lambda} = 0 \qquad \frac{\partial N}{\partial t} + \frac{g h}{R}\frac{\partial \eta}{\partial \varphi} = 0`,
  ],
  cfl: String.raw`\Delta t \le \frac{1}{\sqrt{g h_{\max}}\,\sqrt{\Delta x^{-2} + \Delta y^{-2}}}`,
  scaling: [
    String.raw`\log_{10} L = -2.44 + 0.59\,M_w, \qquad \log_{10} W = -1.01 + 0.32\,M_w`,
    String.raw`M_0 = 10^{1.5 M_w + 9.1}, \qquad D = \frac{M_0}{\mu L W}, \qquad A_0 = \frac{\kappa D}{\cosh(k h)}`,
  ],
  abe: String.raw`\log_{10} H = M_t - \log_{10}\Delta - 5.80 \qquad \log_{10} H_t = M_w - \log_{10}\Delta - 5.55 + C`,
  green: String.raw`\frac{A_2}{A_1} = \left(\frac{h_1}{h_2}\right)^{1/4}, \qquad \left(\frac{4000}{10}\right)^{1/4} \approx 4.47`,
  disp: String.raw`\omega^2 = g k \tanh(k h), \qquad c = \sqrt{\frac{g}{k}\tanh(k h)}, \qquad c_g = \frac{c}{2}\left(1 + \frac{2 k h}{\sinh 2 k h}\right)`,
  speed: String.raw`c = \sqrt{g h} \approx 198\ \mathrm{m\,s^{-1}} \approx 713\ \mathrm{km\,h^{-1}}\quad (h = 4\ \mathrm{km})`,
  fragility: String.raw`P_D(x) = \Phi\!\left[\frac{\ln x - \ln x_m}{\beta}\right]`,
  risk: String.raw`\text{Risk} = \text{Hazard} \times \text{Exposure} \times \text{Vulnerability}`,
  ptha: String.raw`\lambda(H > h) = \sum_{i} \nu_i \int P\left(H > h \mid \mathbf{s}\right) f_i(\mathbf{s})\, d\mathbf{s}`,
};
