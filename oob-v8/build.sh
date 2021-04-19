#Install depot_tools first

fetch v8
cd v8
./build/install-build-deps.sh
git checkout 6dc88c191f5ecc5389dc26efa3ca0907faef3598
gclient sync -D
git apply ../oob.diff
./tools/dev/gm.py x64.release
./tools/dev/gm.py x64.debug

