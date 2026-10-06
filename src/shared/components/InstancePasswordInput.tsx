import { Button, SensitiveInput } from "@cloudflare/kumo";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { generatePassword } from "../utils/credentials";
import { instancePasswordIssues } from "../utils/instancePassword";

export function InstancePasswordInput({ value, onChange, label = "实例密码" }: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const issues = instancePasswordIssues(value);
  return <div className="grid gap-2">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
      <SensitiveInput label={label} value={value} onChange={(event) => onChange(event.target.value)} />
      <Button variant="secondary" shape="square" icon={<ArrowsClockwiseIcon />} aria-label="重新生成密码" onClick={() => onChange(generatePassword())} />
    </div>
    <p className="text-sm text-kumo-subtle">可自行输入或随机生成。需恰好 12 位，包含大小写字母和数字；请勿使用手机号、生日或其他账户的密码。</p>
    <p role="status" aria-live="polite" className="text-sm text-kumo-subtle">{issues.length ? `安全检测：${issues.join("；")}` : "安全检测：符合密码规则，请妥善保存。"}</p>
  </div>;
}
