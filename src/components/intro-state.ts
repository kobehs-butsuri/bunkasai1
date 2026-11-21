// ホームの導入アニメーション(読み込み時の演出)を、リロードまでに一度だけ再生するための状態。
// クライアント側の effect でのみ書き換えるため、SSR/静的書き出しでは常に false になる。
export const introState = { played: false }