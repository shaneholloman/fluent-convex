// Allow Vite ?raw imports for .ts files
declare module "*.ts?raw" {
  const content: string;
  export default content;
}
