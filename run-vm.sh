#!/usr/bin/env bash
# Boots a Lumen OS ISO in QEMU so you can try it without installing.
#   ./run-vm.sh out/lumen-os-YYYYMMDD-amd64.iso
set -euo pipefail

ISO="${1:?usage: ./run-vm.sh path/to/lumen-os.iso}"
command -v qemu-system-x86_64 >/dev/null || { echo "Install qemu-system-x86 first." >&2; exit 1; }

ACCEL=()
[ -w /dev/kvm ] && ACCEL=(-enable-kvm -cpu host)

exec qemu-system-x86_64 \
    "${ACCEL[@]}" \
    -m 4096 -smp 4 \
    -device virtio-vga-gl -display gtk,gl=on \
    -device virtio-net-pci,netdev=n0 -netdev user,id=n0 \
    -device intel-hda -device hda-duplex \
    -usb -device usb-tablet \
    -cdrom "$ISO" -boot d
