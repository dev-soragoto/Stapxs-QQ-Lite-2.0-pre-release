dirs=(
    # web
    "dist"
    "stats.html"
    # electron
    "out"
    "dist_electron"
    # capacitor
    "dist_capacitor"
    # npx
    "ssqq.npx-web-quick-start/bin"
    "ssqq.npx-web-quick-start/node_modules"
    # android
    "src/mobile/android/app/release"
    "src/mobile/android/app/debug"
    # tauri
    "src/tauri/target"
    "dist_tauri"
)

for dir in ${dirs[@]}; do
    if [ -e $dir ]; then
        echo "rm -rf $dir"
        rm -rf $dir
    fi
done
