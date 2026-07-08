"use client";

import type {
  ChangeEvent,
  ChangeEventHandler,
  ClipboardEventHandler,
  InputHTMLAttributes,
} from "react";

type PhoneTextInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "inputMode" | "maxLength"
> & {
  value?: string;
  onValueChange?: (value: string) => void;
  maxLength?: number;
};

export function PhoneTextInput({
  value = "",
  onValueChange,
  onChange,
  onPaste,
  maxLength = 11,
  ...props
}: PhoneTextInputProps) {
  const clean = (v: string) => v.replace(/\D/g, "").slice(0, maxLength);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const nextValue = clean(e.currentTarget.value);
    e.currentTarget.value = nextValue;
    onChange?.(e);
    onValueChange?.(nextValue);
  };

  const handlePaste: ClipboardEventHandler<HTMLInputElement> = (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    const pastedText = e.clipboardData.getData("text");
    const nextValue = clean(`${value}${pastedText}`);
    el.value = nextValue;
    onChange?.({ currentTarget: el } as ChangeEvent<HTMLInputElement>);
    onValueChange?.(nextValue);
    onPaste?.(e);
  };

  return (
    <input
      {...props}
      type="tel"
      inputMode="numeric"
      maxLength={maxLength}
      value={value}
      onChange={handleChange}
      onPaste={handlePaste}
    />
  );
}
