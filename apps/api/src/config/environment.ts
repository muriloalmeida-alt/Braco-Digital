/**
 * Product Review 01 — detecção de ambiente para guards de produção.
 * `NODE_ENV=production` é a convenção do próprio Node/Nest e do
 * `NestFactory` (não é um invento desta feature) — Railway e a maioria
 * dos PaaS já definem essa variável automaticamente em deploy de
 * produção. Um único ponto de verdade evita cada guard reimplementar
 * sua própria lógica de "isto é produção?".
 */
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production';
}
