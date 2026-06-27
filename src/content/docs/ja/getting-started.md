---
title: クイックスタート
description: Varg をインストールし、エディターを起動し、スクリプトサンプルプロジェクトを見つけます。
---

## 前提条件

このページで扱うのは、Varg をどう開くか、そしてサンプルコードがどこにあるかの 2 点だけです。最初からすべてのファイル形式を理解する必要はありません。プロジェクトを開けて、スクリプトの場所が分かれば、次の段階に進めます。

Varg のダウンロードには GitHub Releases を使ってください。

- [https://github.com/viloris-org/Varg/releases](https://github.com/viloris-org/Varg/releases)

エディターを試す、またはサンプルプロジェクトを実行するだけなら、release に含まれるビルド済み成果物を優先してダウンロードしてください。以下のソースコードからの起動手順は、開発に参加する、エンジンをデバッグする、またはエディターを変更する人向けです。

ソースコードからエディターを起動するには、次が必要です。

- Rust 1.96 以上
- Bun 1.3.14 以上
- Tauri v2 のシステム依存関係

Linux でよく使う依存関係:

```sh
sudo apt install libwebkit2gtk-4.1-dev build-essential libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

## エディターを起動する

release パッケージをダウンロードした場合は、展開後に含まれている Varg 実行ファイルをそのまま起動します。

ソースコードから起動し、Varg リポジトリがドキュメントサイトの隣の `../Varg` にある場合:

```sh
cd ../Varg/editor
bun install
bun run dev:tauri
```

起動すると Hub 画面に入ります。プロジェクトを作成または開き、エディター内でオブジェクトを配置し、コンポーネントを追加し、Play モードで物理とスクリプトを実行できます。

スクリプトを学ぶだけなら、最初はサンプルプロジェクトを開くことをおすすめします。空プロジェクトから完全なシーンを組むと、シーン、アセット、スクリプトの取り付け、入力設定を同時に扱うことになり、範囲が広くなります。

## スクリプトサンプルの場所

このマニュアルの構文例は、Varg リポジトリの `examples/scripts` から来ています。

```txt
examples/scripts/
├── loop_demo.varg
├── particle_system.varg
├── timed_sequence.varg
├── wave_spawner.varg
└── weapon_cooldown.varg
```

完全なゲームプレイチュートリアルでは、次のサンプルプロジェクトを使います。

- [examples/project/jump_jump](https://github.com/viloris-org/Varg/tree/main/examples/project/jump_jump)
- [examples/project/fps_arena](https://github.com/viloris-org/Varg/tree/main/examples/project/fps_arena)

これらのサンプルを読むために Varg を fork する必要はありません。GitHub 上で直接ソースを見てもよいですし、release またはソースアーカイブをダウンロードしてローカルで開いてもかまいません。

学習順序は急ぎすぎない方がよいです。

1. `weapon_cooldown.varg`: エクスポートパラメータ、入力、状態、`wait()`
2. `loop_demo.varg`: ループ、`break`、`continue`、ローカル変数
3. `wave_spawner.varg`: 複数状態のスクリプトとライフサイクルの役割分担
4. `particle_system.varg`: タイマーとキーによるリセット
5. `jump_jump`: ランタイムでのプラットフォーム生成、着地点判定、HUD、補助モード。まず主スクリプトの前半だけ読んでもかまいません。
6. `fps_arena`: 一人称移動、リロード、ターゲット生成、命中フィードバック。システムが多いので、`jump_jump` の後がおすすめです。

:::tip[サンプルの読み方]
まず `@export var` を探します。これは通常、デザイナーが調整するパラメータです。次に `var` を探します。これは通常、スクリプト自身が覚えておく状態です。最後に `start()` と `update(_ dt: Float)` を見ます。この読み方の方が、最初の行から最後の行まで力任せに読むよりずっと楽です。
:::

## 覚えておく一文

`.varg` はランタイムロジック、`.vscene` はシーンとオブジェクト構造、`.vasset` はアセット登録、`.vmodel` は生成式モデル記述を書きます。現在実行できる重点は `.varg` スクリプト MVP です。
