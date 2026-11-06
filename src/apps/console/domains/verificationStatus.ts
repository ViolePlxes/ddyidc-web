export type StatusTone = "secondary" | "success" | "warning" | "error";

export function verificationStatus(value?: string | number): { text: string; tone: StatusTone } {
  const key = String(value ?? "").trim().toLowerCase();
  switch (key) {
    case "0": return { text: "未上传证件", tone: "secondary" };
    case "1": return { text: "初审通过", tone: "success" };
    case "2": return { text: "初审中", tone: "warning" };
    case "3": return { text: "初审拒绝", tone: "error" };
    case "4": return { text: "初审异常", tone: "error" };
    case "active":
    case "approved":
    case "passed":
    case "success": return { text: "审核通过", tone: "success" };
    case "pending":
    case "auditing":
    case "review":
    case "processing": return { text: "审核中", tone: "warning" };
    case "rejected":
    case "failed":
    case "refused": return { text: "已拒绝", tone: "error" };
    case "draft":
    case "":
    case "undefined": return { text: "未提交", tone: "secondary" };
    default: return { text: String(value), tone: "secondary" };
  }
}
