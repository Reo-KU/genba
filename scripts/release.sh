#!/bin/bash
# Genba 配布用リリースビルド: Developer ID 署名 + 公証 (notarization) + 検証
#
# 前提 (docs/internal/RELEASE.md 参照):
#   1. Apple Developer Program 加入済み
#   2. "Developer ID Application" 証明書がキーチェーンにある
#   3. 環境変数: APPLE_ID / APPLE_APP_SPECIFIC_PASSWORD / APPLE_TEAM_ID
#
# 出力: /tmp/genba-release/Genba-<version>-arm64.dmg (署名+公証+staple済み)
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
npx electron-builder --mac dmg --config.directories.output=/tmp/genba-release

DMG=$(ls -t /tmp/genba-release/*.dmg | head -1)
APP="/tmp/genba-release/mac-arm64/Genba.app"

echo "== 4/5 検証"
spctl -a -vv "$APP" 2>&1 | head -2
xcrun stapler validate "$DMG"

echo "== 5/5 完了"
ls -lh "$DMG"
echo "このdmgを GitHub Releases にアップロードしてください:"
echo "  gh release create v\$(node -p \"require('./package.json').version\") \"$DMG\" --title \"Genba v...\" --notes \"...\""
