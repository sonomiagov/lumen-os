#!/usr/bin/env bash
# Builds the Lumen OS ISO.
#
#   sudo ./build.sh           build on this machine (needs Debian 13 or a recent Ubuntu)
#   ./build.sh docker         build inside a privileged debian:trixie container
#                             (works from any Linux with Docker or Podman)
#
# Output: out/lumen-os-<date>-amd64.iso and a .sha256 file next to it.
# Needs: ~25 GB free disk, internet access, 20-45 minutes.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-native}"

if [ "$MODE" = "docker" ]; then
    ENGINE="$(command -v docker || command -v podman || true)"
    [ -n "$ENGINE" ] || { echo "Install Docker or Podman first." >&2; exit 1; }
    exec "$ENGINE" run --rm --privileged \
        -v "$HERE":/src -w /src \
        debian:trixie \
        bash -c 'apt-get update && apt-get install -y --no-install-recommends ca-certificates && bash build.sh native'
fi

[ "$(id -u)" -eq 0 ] || { echo "Run as root: sudo ./build.sh" >&2; exit 1; }

apt-get update
apt-get install -y --no-install-recommends \
    live-build debootstrap squashfs-tools xorriso mtools dosfstools \
    syslinux syslinux-common isolinux grub-pc-bin grub-efi-amd64-bin \
    ca-certificates git

if [ ! -e /usr/share/debootstrap/scripts/trixie ]; then
    echo "This host's debootstrap does not know Debian trixie." >&2
    echo "Run './build.sh docker' instead." >&2
    exit 1
fi

BUILD="$HERE/build"
rm -rf "$BUILD"
mkdir -p "$BUILD" "$HERE/out"
cd "$BUILD"

lb config \
    --distribution trixie \
    --architectures amd64 \
    --linux-flavours amd64 \
    --archive-areas "main contrib non-free-firmware" \
    --binary-images iso-hybrid \
    --debian-installer none \
    --memtest none \
    --security true \
    --updates true \
    --iso-application "Lumen OS" \
    --iso-volume "LUMEN_OS" \
    --iso-publisher "Lumen OS" \
    --bootappend-live "boot=live components quiet splash username=lumen hostname=lumen locales=en_US.UTF-8 keyboard-layouts=us timezone=UTC"

# Layer our configuration on top of what `lb config` generated.
cp -a "$HERE/config/." config/
chmod +x config/hooks/live/*.hook.chroot

lb build 2>&1 | tee "$HERE/out/build.log"

ISO="$(ls -1 ./*.iso | head -n1)"
STAMP="$(date +%Y%m%d)"
FINAL="$HERE/out/lumen-os-$STAMP-amd64.iso"
mv "$ISO" "$FINAL"
( cd "$HERE/out" && sha256sum "$(basename "$FINAL")" > "$(basename "$FINAL").sha256" )

echo
echo "Done: $FINAL"
echo "Try it:   ./run-vm.sh \"$FINAL\""
echo "Write it: sudo dd if=\"$FINAL\" of=/dev/sdX bs=4M status=progress conv=fsync"
