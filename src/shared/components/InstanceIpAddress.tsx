import { Button, InlineCopyText, Popover } from "@cloudflare/kumo";
import { instanceAddress } from "../utils/instanceAddress";

interface InstanceIpAddressProps {
  primaryIp?: string;
  ips?: string[];
  port?: string;
  operatingSystem?: string;
}

/**
 * A service can own several public addresses. The list shows the primary one and
 * the total count; the rest live in a popover instead of stretching the column.
 */
export function InstanceIpAddress({ primaryIp, ips, port, operatingSystem }: InstanceIpAddressProps) {
  const addresses: string[] = [];
  for (const value of [primaryIp, ...(ips ?? [])]) {
    const address = value?.trim();
    if (address && !addresses.includes(address)) addresses.push(address);
  }
  if (addresses.length === 0) return <span>未获取</span>;

  const firstAddress = addresses[0] ?? "";
  const primary = instanceAddress(primaryIp ?? firstAddress, port, operatingSystem) ?? firstAddress;
  if (addresses.length === 1) {
    return (
      <InlineCopyText className="w-fit leading-[normal]" value={primary} labels={{ copyAction: "复制连接地址", copied: "已复制" }}>
        {primary}
      </InlineCopyText>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto max-w-full gap-1 px-0 py-0 text-left font-normal"
            aria-label={`查看全部 ${addresses.length} 个 IP 地址`}
          >
            <span className="break-all underline decoration-kumo-hairline decoration-dotted underline-offset-4">{addresses[0]}</span>
            <span className="shrink-0 text-kumo-subtle">({addresses.length})</span>
          </Button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={8}>
          <Popover.Popup className="w-72 max-w-[calc(100vw-2rem)] text-left text-sm font-normal">
            <Popover.Arrow />
            <Popover.Title>IP 地址（{addresses.length}）</Popover.Title>
            <ul className="mt-2 grid gap-2">
              {addresses.map((address, index) => (
                <li key={address} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <InlineCopyText
                    className="w-fit leading-[normal]"
                    value={index === 0 ? primary : address}
                    labels={{ copyAction: "复制 IP 地址", copied: "已复制" }}
                  >
                    {index === 0 ? primary : address}
                  </InlineCopyText>
                  {index === 0 ? <span className="text-xs text-kumo-subtle">主 IP</span> : null}
                </li>
              ))}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
