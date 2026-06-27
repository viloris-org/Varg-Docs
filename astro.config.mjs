import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: {
        'zh-CN': 'Varg 文档',
        en: 'Varg Docs',
        ja: 'Varg ドキュメント',
        es: 'Documentación de Varg',
        de: 'Varg-Dokumentation',
      },
      description: 'Varg 脚本语法、编辑器流程与打包构建指南',
      defaultLocale: 'zh',
      locales: {
        zh: { label: '简体中文', lang: 'zh-CN' },
        en: { label: 'English', lang: 'en' },
        ja: { label: '日本語', lang: 'ja' },
        es: { label: 'Español', lang: 'es' },
        de: { label: 'Deutsch', lang: 'de' },
      },
      customCss: ['./src/styles/custom.css'],
      social: [
        { icon: 'github', label: 'Varg on GitHub', href: 'https://github.com/viloris-org/Varg' },
      ],
      sidebar: [
        {
          label: '开始',
          translations: {
            en: 'Start',
            ja: 'はじめに',
            es: 'Inicio',
            de: 'Start',
          },
          items: [
            {
              label: '文档首页',
              translations: {
                en: 'Docs Home',
                ja: 'ドキュメントホーム',
                es: 'Inicio de la documentación',
                de: 'Dokumentationsstart',
              },
              slug: 'index',
            },
            {
              label: '快速上手',
              translations: {
                en: 'Getting Started',
                ja: 'クイックスタート',
                es: 'Primeros pasos',
                de: 'Schnellstart',
              },
              slug: 'getting-started',
            },
            {
              label: '项目结构',
              translations: {
                en: 'Project Structure',
                ja: 'プロジェクト構成',
                es: 'Estructura del proyecto',
                de: 'Projektstruktur',
              },
              slug: 'project-structure',
            },
          ],
        },
        {
          label: '脚本语法教学',
          translations: {
            en: 'Scripting Guide',
            ja: 'スクリプトガイド',
            es: 'Guía de scripting',
            de: 'Scripting-Leitfaden',
          },
          items: [
            {
              label: '零基础脚本入门',
              translations: {
                en: 'Programming Primer',
                ja: 'プログラミング入門',
                es: 'Introducción a programación',
                de: 'Programmiergrundlagen',
              },
              slug: 'scripting/programming-primer',
            },
            {
              label: '脚本基础',
              translations: {
                en: 'Scripting Basics',
                ja: 'スクリプト基礎',
                es: 'Fundamentos de scripting',
                de: 'Scripting-Grundlagen',
              },
              slug: 'scripting/basics',
            },
            {
              label: '生命周期与输入',
              translations: {
                en: 'Lifecycle and Input',
                ja: 'ライフサイクルと入力',
                es: 'Ciclo de vida y entrada',
                de: 'Lebenszyklus und Eingabe',
              },
              slug: 'scripting/lifecycle-input',
            },
            {
              label: '状态、变量与导出',
              translations: {
                en: 'State, Variables, and Exports',
                ja: '状態、変数、エクスポート',
                es: 'Estado, variables y exportaciones',
                de: 'Status, Variablen und Exporte',
              },
              slug: 'scripting/state-export',
            },
            {
              label: '控制流与等待',
              translations: {
                en: 'Control Flow and Waiting',
                ja: '制御フローと待機',
                es: 'Control de flujo y esperas',
                de: 'Kontrollfluss und Warten',
              },
              slug: 'scripting/control-flow',
            },
            {
              label: '组织玩法脚本',
              translations: {
                en: 'Organizing Gameplay Scripts',
                ja: 'ゲームプレイスクリプトの整理',
                es: 'Organizar scripts de juego',
                de: 'Gameplay-Skripte organisieren',
              },
              slug: 'scripting/gameplay-loop-patterns',
            },
            {
              label: '高级运行时 API',
              translations: {
                en: 'Advanced Runtime APIs',
                ja: '高度なランタイム API',
                es: 'APIs avanzadas de runtime',
                de: 'Erweiterte Runtime-APIs',
              },
              slug: 'scripting/advanced-runtime-apis',
            },
            {
              label: '示例拆解',
              translations: {
                en: 'Example Walkthroughs',
                ja: 'サンプル解説',
                es: 'Desglose de ejemplos',
                de: 'Beispielanalysen',
              },
              slug: 'scripting/examples',
            },
          ],
        },
        {
          label: '项目教程',
          translations: {
            en: 'Project Tutorials',
            ja: 'プロジェクトチュートリアル',
            es: 'Tutoriales de proyectos',
            de: 'Projekt-Tutorials',
          },
          items: [
            {
              label: '中间练习：收集循环',
              translations: {
                en: 'Intermediate Exercise: Collection Loop',
                ja: '中級演習：収集ループ',
                es: 'Ejercicio intermedio: bucle de recolección',
                de: 'Zwischenübung: Sammelschleife',
              },
              slug: 'tutorials/first-playable-loop',
            },
            {
              label: '制作无尽跳跃',
              translations: {
                en: 'Build an Endless Jumper',
                ja: 'エンドレスジャンプを作る',
                es: 'Crear un salto infinito',
                de: 'Endlos-Jumper bauen',
              },
              slug: 'tutorials/jump-jump',
            },
            {
              label: '制作射击训练场',
              translations: {
                en: 'Build a Shooting Range',
                ja: '射撃訓練場を作る',
                es: 'Crear un campo de tiro',
                de: 'Schiesstrainingsplatz bauen',
              },
              slug: 'tutorials/fps-arena',
            },
          ],
        },
        {
          label: '其他功能',
          translations: {
            en: 'Other Features',
            ja: 'その他の機能',
            es: 'Otras funciones',
            de: 'Weitere Funktionen',
          },
          items: [
            {
              label: '编辑器工作流',
              translations: {
                en: 'Editor Workflow',
                ja: 'エディターワークフロー',
                es: 'Flujo del editor',
                de: 'Editor-Workflow',
              },
              slug: 'features/editor-workflow',
            },
            {
              label: '资源、场景与声明式文件',
              translations: {
                en: 'Assets, Scenes, and Declarative Files',
                ja: 'アセット、シーン、宣言型ファイル',
                es: 'Recursos, escenas y archivos declarativos',
                de: 'Assets, Szenen und deklarative Dateien',
              },
              slug: 'features/assets-scenes',
            },
            {
              label: '构建、测试与打包',
              translations: {
                en: 'Build, Test, and Package',
                ja: 'ビルド、テスト、パッケージ化',
                es: 'Compilar, probar y empaquetar',
                de: 'Bauen, testen und paketieren',
              },
              slug: 'features/build-package',
            },
          ],
        },
      ],
    }),
  ],
});
