import "react";

declare module "react" {
  interface CSSProperties {
    "--ingredient"?: string;
  }
}
