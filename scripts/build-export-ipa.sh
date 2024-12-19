rm -rf dist_capacitor

VERSION=$(node -p "require('./package.json').version")
IPA_NAME="Stapxs.QQ.Lite-$VERSION.ipa"
EXPORT_PATH="dist_capacitor/$IPA_NAME"

xcodebuild clean build \
    -workspace src/mobile/ios/App/App.xcworkspace \
    -scheme App \
    -archivePath dist_capacitor/App.xcarchive \
    -sdk iphoneos \
    CODE_SIGNING_ALLOWED=NO \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGN_IDENTITY="" archive

xcodebuild -exportArchive \
    -archivePath dist_capacitor/App.xcarchive \
    -exportPath dist_capacitor \
    -exportOptionsPlist build/ExportOptions.plist \
    CODE_SIGNING_ALLOWED=NO \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGN_IDENTITY=""

mv "dist_capacitor/App.ipa" "$EXPORT_PATH"
