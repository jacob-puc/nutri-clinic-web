import type { ControllerRenderProps, FieldValues, Path } from "react-hook-form";
export function campoNumero<
  T extends FieldValues,
  N extends Path<T>,
>(field: ControllerRenderProps<T, N>) {
  return {
    value: (field.value as number | undefined) ?? "",
    name: field.name,
    ref: field.ref,
    onBlur: field.onBlur,
    onChange: (evento: React.ChangeEvent<HTMLInputElement>) => {
      const bruto = evento.target.value;
      field.onChange(bruto === "" ? undefined : Number(bruto));
    },
  };
}
