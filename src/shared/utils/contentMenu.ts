export interface ContentMenuItem { id: string; label: string; section: string }
export interface ContentMenuRoot { id: string; label: string; groups: { label: string; items: ContentMenuItem[] }[] }
export const contentMenuRoots: ContentMenuRoot[] = [
  {
    "id": "home",
    "label": "首页",
    "groups": [
      {
        "label": "首页",
        "items": [
          {
            "id": "home--1",
            "label": "控制台",
            "section": "pending"
          },
          {
            "id": "home--2",
            "label": "用户中心",
            "section": "pending"
          },
          {
            "id": "home--3",
            "label": "访问监控",
            "section": "pending"
          },
          {
            "id": "home--4",
            "label": "排名统计",
            "section": "pending"
          }
        ]
      }
    ]
  },
  {
    "id": "frontend",
    "label": "前台",
    "groups": [
      {
        "label": "基础配置",
        "items": [
 {"id":"frontend-public-pages","label":"官网页面管理","section":"publicPages"},
          {
            "id": "frontend--1",
            "label": "站务信息",
            "section": "site"
          },
          {
            "id": "frontend--2",
            "label": "全局配置",
            "section": "site"
          },
          {
            "id": "frontend--3",
            "label": "SEO管理",
            "section": "seo"
          },
          {
            "id": "frontend--28",
            "label": "自定义字段",
            "section": "pending"
          },
          {
            "id": "frontend--29",
            "label": "资源管理",
            "section": "media"
          },
          {
            "id": "frontend--30",
            "label": "Html编辑",
            "section": "htmlEditor"
          }
        ]
      },
      {
        "label": "菜单设置",
        "items": [
          {
            "id": "frontend--4",
            "label": "菜单编辑",
            "section": "navigation"
          },
          {
            "id": "frontend--5",
            "label": "菜单全局",
            "section": "menuSettings"
          }
        ]
      },
      {
        "label": "轮播设置",
        "items": [
          {
            "id": "frontend--6",
            "label": "首页轮播",
            "section": "carousel"
          },
          {
            "id": "frontend--7",
            "label": "轮播下方",
            "section": "belowCarousel"
          },
          {
            "id": "frontend--8",
            "label": "轮播全局",
            "section": "carouselSettings"
          }
        ]
      },
      {
        "label": "资质|环境",
        "items": [
          {
            "id": "frontend--9",
            "label": "公司环境",
            "section": "environment"
          },
          {
            "id": "frontend--10",
            "label": "荣耀证书",
            "section": "honors"
          },
          {
            "id": "frontend--11",
            "label": "许可证书",
            "section": "licenses"
          }
        ]
      },
      {
        "label": "模块管理",
        "items": [
          {
            "id": "frontend--12",
            "label": "通用模块",
            "section": "modules"
          },
          {
            "id": "frontend--13",
            "label": "手机模块",
            "section": "pending"
          },
          {
            "id": "frontend--14",
            "label": "产品模块",
            "section": "productModules"
          }
        ]
      },
      {
        "label": "页面内容",
        "items": [
 {"id":"frontend-public-policies","label":"服务协议与隐私","section":"publicPolicies"},
 {"id":"frontend-product-introductions","label":"官网产品介绍","section":"productIntroductions"},
          {"id":"frontend-company","label":"企业信息","section":"company"},
          {"id":"frontend-contact","label":"联系我们","section":"contact"},
          {"id":"frontend-recruit","label":"人才招聘","section":"recruit"},
          {
            "id": "frontend--15",
            "label": "页面绑定",
            "section": "pages"
          },
          {
            "id": "frontend--16",
            "label": "百站赞助",
            "section": "sponsors"
          },
          {
            "id": "frontend--17",
            "label": "简介|资质",
            "section": "about"
          },
          {
            "id": "frontend--18",
            "label": "解决方案",
            "section": "solutions"
          },
          {
            "id": "frontend--19",
            "label": "服务保障",
            "section": "guarantees"
          },
          {
            "id": "frontend--20",
            "label": "推广返利",
            "section": "referralPage"
          },
          {
            "id": "frontend--21",
            "label": "代理合作",
            "section": "agency"
          },
          {
            "id": "frontend--22",
            "label": "宝塔面板",
            "section": "panel"
          },
          {
            "id": "frontend--23",
            "label": "活动页面",
            "section": "campaignPage"
          },
          {
            "id": "frontend--24",
            "label": "新闻帮助",
            "section": "newsHelp"
          }
        ]
      },
      {
        "label": "活动管理",
        "items": [
          {
            "id": "frontend--25",
            "label": "发布活动",
            "section": "campaignCreate"
          },
          {
            "id": "frontend--26",
            "label": "活动列表",
            "section": "campaignList"
          },
          {
            "id": "frontend--27",
            "label": "产品编辑",
            "section": "pending"
          }
        ]
      },
      {
        "label": "发布与扩展",
        "items": [
          {
            "id": "frontend--footer",
            "label": "底部链接",
            "section": "footer"
          },
          {
            "id": "frontend--revisions",
            "label": "版本记录",
            "section": "revisions"
          }
        ]
      }
    ]
  },
  {
    "id": "products",
    "label": "产品",
    "groups": [
      {
        "label": "产品",
        "items": [
          {
            "id": "products--1",
            "label": "系统产品",
            "section": "pending"
          }
        ]
      },
      {
        "label": "产品类型",
        "items": [
          {
            "id": "products--2",
            "label": "类型管理",
            "section": "pending"
          }
        ]
      }
    ]
  },
  {
    "id": "articles",
    "label": "文章",
    "groups": [
      {
        "label": "文章",
        "items": [
          {
            "id": "articles--1",
            "label": "新闻列表",
            "section": "articles"
          },
          {
            "id": "articles--2",
            "label": "帮助列表",
            "section": "help"
          },
          {
            "id": "articles--3",
            "label": "发布文章",
            "section": "articles"
          }
        ]
      },
      {
        "label": "分类管理",
        "items": [
          {
            "id": "articles--categories",
            "label": "分类管理",
            "section": "categories"
          }
        ]
      }
    ]
  },
  {
    "id": "cart",
    "label": "购物车",
    "groups": [
      {
        "label": "购物车",
        "items": [
          {
            "id": "cart--1",
            "label": "全局设置",
            "section": "pending"
          },
          {
            "id": "cart--2",
            "label": "选购页面",
            "section": "pending"
          },
          {
            "id": "cart--3",
            "label": "配置页面",
            "section": "pending"
          }
        ]
      }
    ]
  },
  {
    "id": "user-center",
    "label": "用户中心",
    "groups": [
      {
        "label": "用户中心",
        "items": [
          {
            "id": "user-center--1",
            "label": "全局设置",
            "section": "pending"
          },
          {
            "id": "user-center--2",
            "label": "提示设置",
            "section": "pending"
          }
        ]
      }
    ]
  },
  {
    "id": "indexing",
    "label": "收录",
    "groups": [
      {
        "label": "收录",
        "items": [
          {
            "id": "indexing--1",
            "label": "基础设置",
            "section": "pending"
          },
          {
            "id": "indexing--2",
            "label": "收录推送",
            "section": "pending"
          },
          {
            "id": "indexing--3",
            "label": "推送日志",
            "section": "pending"
          }
        ]
      }
    ]
  },
  {
    "id": "feedback",
    "label": "反馈",
    "groups": [
      {
        "label": "反馈",
        "items": [
          {
            "id": "feedback--1",
            "label": "用户反馈",
            "section": "pending"
          },
          {
            "id": "feedback--2",
            "label": "提交反馈",
            "section": "pending"
          },
          {
            "id": "feedback--3",
            "label": "授权查询",
            "section": "pending"
          },
          {
            "id": "feedback--4",
            "label": "盗版举报",
            "section": "pending"
          }
        ]
      }
    ]
  },
  {
    "id": "plugins",
    "label": "实用插件",
    "groups": [
      {
        "label": "实用插件",
        "items": [
          {
            "id": "plugins--1",
            "label": "全局文件",
            "section": "pending"
          },
          {
            "id": "plugins--2",
            "label": "漏删查询",
            "section": "pending"
          },
          {
            "id": "plugins--3",
            "label": "微信登录",
            "section": "pending"
          },
          {
            "id": "plugins--4",
            "label": "极验防刷",
            "section": "pending"
          },
          {
            "id": "plugins--5",
            "label": "群发营销",
            "section": "pending"
          },
          {
            "id": "plugins--6",
            "label": "主题管理",
            "section": "themes"
          }
        ]
      }
    ]
  }
];
export const contentMenuItems = contentMenuRoots.flatMap(root => root.groups.flatMap(group => group.items));
export function resolveContentMenu(route: string) { const item = contentMenuItems.find(item => item.id === route) ?? contentMenuItems.find(item => item.section === route); const root = contentMenuRoots.find(root => root.groups.some(group => group.items.some(child => child.id === item?.id))) ?? contentMenuRoots[1]!; return { root, item, section: item?.section ?? 'pending' }; }
