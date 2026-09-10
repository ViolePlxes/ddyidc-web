const letters = "abcdefghijklmnopqrstuvwxyz";
const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numbers = "0123456789";

function randomFrom(pool: string): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return pool[(bytes[0] ?? 0) % pool.length] ?? "x";
}

export function generateHostname(): string {
  const suffix = Array.from({ length: 12 }, () => randomFrom(numbers)).join("");
  return `ser${suffix}`;
}

export function generatePassword(): string {
  const required = [
    randomFrom(letters),
    randomFrom(upper),
    randomFrom(numbers),
  ];
  const rest = Array.from({ length: 9 }, () =>
    randomFrom(letters + upper + numbers),
  );
  const chars = [...required, ...rest];
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const swapIndex = (bytes[0] ?? 0) % (index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex]!, chars[index]!];
  }
  return chars.join("");
}
