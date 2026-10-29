/* Entirely fictional public data; no real customer or pricing material. */
window.FICTIONAL_MATTER = {
  "identity": "TXSENSER_PUBLIC_FICTIONAL_BUSINESS_CASE_V1",
  "demonstration": true,
  "matter_key": "matter:synthetic:sample-inquiry",
  "customer": {
    "name": "示例客户 A（虚构）",
    "contact": "示例采购联系人",
    "role_en": "Procurement Coordinator",
    "role_cn": "采购协调员"
  },
  "matter": {
    "title": "气体检测设备询盘 · 12 台",
    "stage": "需求核实中（演示）",
    "brief": "客户咨询 12 台检测设备，希望了解资料、价格和交期。关键配置与正式报价均未确认。",
    "next_step": "向客户确认检测气体与安装环境，同时内部核实准确产品、价格和交期；当前不作报价或交付承诺。"
  },
  "source_mail": {
    "matter_key": "matter:synthetic:sample-inquiry",
    "selected_source_id": "synthetic:mail:request",
    "coverage": "partial",
    "messages": [
      {
        "source_id": "synthetic:mail:history",
        "source_revision": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "sender": "示例客户 A · 采购协调员",
        "sent_at": "2026-10-01T10:00:00Z",
        "subject": "此前的产品资料咨询（虚构）",
        "availability": "available",
        "original": {
          "source_id": "synthetic:mail:history",
          "source_revision": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "status": "complete",
          "text": "Dear Example Team,\n\nWe are exploring gas monitoring options for a warehouse. Could you share a general product introduction? We are still collecting application details.\n\nRegards,\nExample Purchasing Contact",
          "reason": ""
        },
        "translation": {
          "source_id": "synthetic:mail:history",
          "source_revision": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "status": "complete",
          "text": "示例团队：\n\n我们正在了解仓库气体监测方案，希望先获得一般性产品介绍。目前仍在收集具体使用条件。\n\n此致\n示例采购联系人",
          "reason": ""
        }
      },
      {
        "source_id": "synthetic:mail:request",
        "source_revision": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "sender": "示例客户 A · 采购协调员",
        "sent_at": "2026-10-29T08:00:00Z",
        "subject": "咨询12台气体检测设备的资料、价格和交期（虚构）",
        "availability": "available",
        "original": {
          "source_id": "synthetic:mail:request",
          "source_revision": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          "status": "complete",
          "text": "Dear Sales Team,\n\nFollowing our earlier discussion, we may need 12 gas detection units for a warehouse project. Could you share the appropriate technical information, an indicative price, and expected lead time? We are still confirming which gas and installation conditions apply.\n\nThank you for your support.\n\nBest regards,\nExample Purchasing Contact",
          "reason": ""
        },
        "translation": {
          "source_id": "synthetic:mail:request",
          "source_revision": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          "status": "complete",
          "text": "销售团队：\n\n接续之前的沟通，我们的仓库项目可能需要 12 台气体检测设备。请提供适用的技术资料、参考报价和预计交期。目前我们仍在确认需要检测的气体种类以及安装条件。\n\n感谢你们的支持。\n\n此致\n示例采购联系人",
          "reason": ""
        }
      }
    ]
  },
  "evidence": {
    "facts": [
      {
        "text": "客户在最新邮件中提出可能需要 12 台设备，并询问资料、价格和交期。",
        "source_id": "synthetic:mail:request"
      },
      {
        "text": "此前邮件仅提及仓库监测方向，没有确认具体气体和环境。",
        "source_id": "synthetic:mail:history"
      }
    ],
    "unknown": [
      "需要检测的气体、浓度范围及安装条件",
      "适用的准确产品配置与认证要求",
      "有效报价、商务条件和实际交期"
    ],
    "suggestion": "先回应客户的询问并澄清应用条件，内部核实准确配置、价格和交期；不要把未知内容写成承诺。",
    "challenge": "如果现在直接报价，依据是什么？当前尚无可以对外使用的具体型号、价格和交期，因此不应编造。"
  },
  "strategies": [
    {
      "id": "acknowledge",
      "title": "先确认需求并开展内部核实",
      "english": "Dear Example Purchasing Contact,\n\nThank you for your follow-up and for outlining the possible requirement for 12 gas detection units.\n\nWe will review the suitable configuration, pricing, and lead time before providing a formal proposal. To help us identify the appropriate solution, could you please confirm the target gas and the installation conditions for the warehouse?\n\nWe appreciate your interest and will be pleased to continue the discussion.\n\nBest regards,\nExample Sales Team",
      "chinese": "示例采购联系人：\n\n感谢您的进一步来信，并介绍可能需要 12 台气体检测设备的需求。\n\n我们将先核实适用配置、价格和交期，再提供正式方案。为了帮助我们确定合适的解决方案，烦请确认仓库需要检测的气体种类及安装条件。\n\n感谢您对我们的关注，期待继续交流。\n\n此致\n示例销售团队",
      "next": "内部核实产品配置、报价和交期；等待客户补充具体工况。"
    },
    {
      "id": "clarify",
      "title": "先集中确认技术条件",
      "english": "Dear Example Purchasing Contact,\n\nThank you for your inquiry about 12 gas detection units. We would be glad to help you evaluate a suitable solution.\n\nBefore discussing a specific model, price, or delivery schedule, could you please confirm the gas to be monitored, the measuring range, and the installation environment? These details will help us evaluate the appropriate configuration.\n\nThank you again for considering us.\n\nBest regards,\nExample Sales Team",
      "chinese": "示例采购联系人：\n\n感谢您咨询 12 台气体检测设备。我们愿意协助评估适用方案。\n\n在讨论具体型号、价格或交期之前，烦请先确认需要监测的气体、测量范围以及安装环境。这些条件有助于我们评估正确的配置。\n\n再次感谢您的关注。\n\n此致\n示例销售团队",
      "next": "先等待客户明确气体、量程和安装条件，再继续技术和商务评估。"
    }
  ]
};
