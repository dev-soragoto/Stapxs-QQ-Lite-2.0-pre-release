dirs=(
    "dist"
    "dist_electron"
    "dist_capacitor"
    "out"
    "ssqq.npx-web-quick-start/bin"
    "ssqq.npx-web-quick-start/node_modules"
    "stats.html"
)

for dir in ${dirs[@]}; do
    if [ -e $dir ]; then
        echo "rm -rf $dir"
        rm -rf $dir
    fi
done
