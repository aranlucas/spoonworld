export type { CSSProperties } from "react";

declare module "react" {
  interface CSSProperties {
    "--ingredient"?: string;
  }
}
