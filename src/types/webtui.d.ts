import "svelte/elements";

declare module "svelte/elements" {
  interface HTMLAttributes<T extends EventTarget> {
    "box-"?: "square" | "round" | "double" | "double round";
    "shear-"?: "top" | "bottom" | "both";
    "is-"?: string;
  }
}
