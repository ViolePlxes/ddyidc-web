/** Match the existing order API's 12-byte credential contract. */
export function instancePasswordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length !== 12) issues.push("密码必须恰好为 12 位");
  if (!/^[\x21-\x7e]+$/.test(password)) issues.push("请使用英文字母、数字或英文符号，不含空格或中文");
  if (!/[a-z]/.test(password)) issues.push("需包含小写字母");
  if (!/[A-Z]/.test(password)) issues.push("需包含大写字母");
  if (!/[0-9]/.test(password)) issues.push("需包含数字");
  if (password && (new Set(password).size < 6 || /(.)\1{3}/.test(password) || /password|qwerty|123456|abcdef/i.test(password))) {
    issues.push("请避免常见密码、连续序列或大量重复字符");
  }
  return issues;
}
