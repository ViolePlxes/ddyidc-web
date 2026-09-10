import { Input } from "@cloudflare/kumo";
import { useRef } from "react";

export function VerificationCodeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? "");
  const setDigit = (index: number, digit: string) => {
    const next = [...digits];
    next[index] = digit.replace(/\D/g, "").slice(-1);
    onChange(next.join(""));
    if (next[index] && index < 5) refs.current[index + 1]?.focus();
  };
  return (
    <div className="grid grid-cols-6 gap-2" aria-label="六位验证码">
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`第 ${index + 1} 位验证码`}
          className="text-center"
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digit && index > 0)
              refs.current[index - 1]?.focus();
          }}
        />
      ))}
    </div>
  );
}
