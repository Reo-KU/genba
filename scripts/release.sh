#!/bin/bash
# Seiton 配布用リリースビルド: Developer ID 署名 + 公証 (notarization) + 検証
#
# 前提 (docs/internal/RELEASE.md 参照):
#   1. Apple Developer Program 加入済み
#   2. "Developer ID Application" 証明書がキーチェーンにある
#   3. 環境変数: APPLE_ID / APPLE_APP_SPECIFIC_PASSWORD / APPLE_TEAM_ID
#
# 出力: /tmp/seiton-release/Seiton-<version>-arm64.dmg (署名+公証+staple済み)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== 1/5 前提チェック"
IDENTITY=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1 | sed 's/.*"\(.*\)"/\1/')
if [ -z "$IDENTITY" ]; then
  echo "ERROR: 'Developer ID Application' 証明書がキーチェーンにありません。"
  echo "  Xcode > Settings > Accounts > Manage Certificates から作成してください。"
  exit 1
fi
echo "  署名ID: $IDENTITY"
for v in APPLE_ID APPLE_APP_SPECIFIC_PASSWORD APPLE_TEAM_ID; do
  if [ -z "${!v:-}" ]; then
    echo "ERROR: 環境変数 $v が未設定です (公証に必要)。docs/internal/RELEASE.md 参照。"
    exit 1
  fi
done

echo "== 2/5 アプリビルド"
npm run build

echo "== 3/5 dmg 生成 + 署名 + 公証 (数分かかります)"
# 出力は iCloud 外へ (Desktop 配下だと拡張属性で codesign が失敗する)
# CSC_NAME は証明書タイプの接頭辞を含めてはいけない (electron-builder が自動選択する)
export CSC_NAME="${IDENTITY#Developer ID Application: }"
npx electron-builder --mac dmg --config.directories.output=/tmp/seiton-release

DMG=$(ls -t /tmp/seiton-release/*.dmg | head -1)
APP="/tmp/seiton-release/mac-arm64/Seiton.app"

# electron-builder は .app だけを公証して dmg を作るため、**dmg 容器自体にはチケットが無い**。
# ダウンロードした dmg をオフラインで開くと警告が出るので、dmg も公証して staple する。
# 中身の .app は公証済みなので、この送信は通常数分で通る。
# dmg 容器にもコード署名を付ける。署名が無いと spctl が
# 'no usable signature' で reject する (公証チケットだけでは不十分)。
# 順序が重要: 署名 → 公証 → staple。署名は staple を無効化するため後から署名してはいけない。
echo "== 4/5 dmg の署名 + 公証 + staple"
codesign --force --sign "$IDENTITY" --timestamp "$DMG"
xcrun notarytool submit "$DMG" \
  --apple-id "$APPLE_ID" --password "$APPLE_APP_SPECIFIC_PASSWORD" --team-id "$APPLE_TEAM_ID" --wait
xcrun stapler staple "$DMG"

echo "== 5/5 検証"
spctl -a -vv "$APP" 2>&1 | head -2
xcrun stapler validate "$DMG"

echo "== 完了"
ls -lh "$DMG"
echo "このdmgを GitHub Releases にアップロードしてください:"
echo "  gh release create v\$(node -p \"require('./package.json').version\") \"$DMG\" --title \"Seiton v...\" --notes \"...\""
