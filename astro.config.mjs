import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Varg Docs',
      description: 'Varg 脚本语法、编辑器流程与打包构建指南',
      defaultLocale: 'zh-cn',
      customCss: ['./src/styles/custom.css'],
      social: [
        { icon: 'github', label: 'Varg on GitHub', href: 'https://github.com/viloris-org/Varg' },
      ],
      sidebar: [
        {
          label: '开始',
          items: [
            { label: '文档首页', slug: 'index' },
            { label: '快速上手', slug: 'getting-started' },
            { label: '项目结构', slug: 'project-structure' },
          ],
        },
        {
          label: '脚本语法教学',
          items: [
            { label: '零基础脚本入门', slug: 'scripting/programming-primer' },
            { label: '脚本基础', slug: 'scripting/basics' },
            { label: '生命周期与输入', slug: 'scripting/lifecycle-input' },
            { label: '状态、变量与导出', slug: 'scripting/state-export' },
            { label: '控制流与等待', slug: 'scripting/control-flow' },
            { label: '高级运行时 API', slug: 'scripting/advanced-runtime-apis' },
            { label: '示例拆解', slug: 'scripting/examples' },
          ],
        },
        {
          label: '项目教程',
          items: [
            { label: '中间练习：收集循环', slug: 'tutorials/first-playable-loop' },
            { label: '制作无尽跳跃', slug: 'tutorials/jump-jump' },
            { label: '制作射击训练场', slug: 'tutorials/fps-arena' },
          ],
        },
        {
          label: '其他功能',
          items: [
            { label: '编辑器工作流', slug: 'features/editor-workflow' },
            { label: '资源、场景与声明式文件', slug: 'features/assets-scenes' },
            { label: '构建、测试与打包', slug: 'features/build-package' },
          ],
        },
      ],
    }),
  ],
});
