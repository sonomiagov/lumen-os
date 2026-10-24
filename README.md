# Lumen OS

A bootable Linux ISO (Debian 13 + GNOME) that looks and behaves like macOS: a translucent top bar, a centered magnifying-style dock, traffic-light window buttons on the left, natural scrolling, Super+Space search, Super+Q to close a window, and a light/dark wallpaper pair. It includes a graphical installer (Calamares) and boots live, so you can try it before installing.

## Build the ISO

You need a Linux machine (or VM) with internet access, about 25 GB free disk and 20-45 minutes.

```bash
# Debian 13, or any machine with Docker/Podman (recommended, works everywhere):
./build.sh docker

# Or directly on Debian 13:
sudo ./build.sh
```

Result: `out/lumen-os-<date>-amd64.iso` (plus a `.sha256`).

Try it in a VM:

```bash
./run-vm.sh out/lumen-os-<date>-amd64.iso
```

Write it to a USB stick (replace `/dev/sdX`, double-check it first):

```bash
sudo dd if=out/lumen-os-<date>-amd64.iso of=/dev/sdX bs=4M status=progress conv=fsync
```

Live session login: user `lumen`, password `live`. The session starts automatically on the desktop.

## Build without a Linux machine (Windows or Mac, free)

GitHub can build the ISO for you on its own servers.

1. Make a free account at github.com and create a new **public** repository (public matters: private repos only get 500 MB of artifact storage, an ISO is a few GB).
2. Extract the kit zip, then in the repository choose **Add file > Upload files** and drag in everything from inside the `lumen-os` folder, including the hidden `.github` folder. If `.github` does not upload, choose **Add file > Create new file**, type `.github/workflows/build-iso.yml` as the name and paste in the contents of `build-iso.yml`.
3. Open the **Actions** tab, pick **Build Lumen OS ISO** on the left, and press **Run workflow**.
4. After 30-60 minutes open the finished run and download `lumen-os-iso` from the **Artifacts** section. Unzip it to get the `.iso`.
5. Write it to a USB stick with Rufus or balenaEtcher, or boot it in VirtualBox/VMware (create a Linux, 64-bit VM with 4 GB RAM and enable 3D acceleration).

## What gives it the macOS look and feel

| Piece | How |
|---|---|
| Windows, controls, Nautilus | WhiteSur GTK theme (Light default, Dark included) |
| Icons and cursors | WhiteSur icon theme and cursors |
| Dock | Dash to Dock: bottom, floating-style, app grid at the left, trash, running dots |
| Top bar | `lumen-shell` extension (in this repo): system menu at left, bold focused-app name, clock at the far right, no Activities button |
| Blur | Blur My Shell (installed when available in the release) |
| Font | Inter in place of San Francisco |
| Window buttons | Close, minimize, maximize on the left |
| Shortcuts | Super+Space search, Super+Q close, Super+M minimize, Super+\` cycle app windows, Shift+Super+5 screenshots |
| Touchpad/mouse | Natural scrolling and tap-to-click on by default; GNOME's 3-finger gestures work as they do on a Mac |
| Wallpapers | Generated light and dark mesh gradients, switching with the system theme |

## Where to change things

- `config/package-lists/lumen.list.chroot`: what is installed
- `config/includes.chroot_after_packages/etc/dconf/db/local.d/00-lumen`: every default (theme, dock, shortcuts, favorites)
- `config/includes.chroot_after_packages/usr/share/gnome-shell/extensions/lumen-shell@lumen-os/`: the top bar
- `config/hooks/live/`: theme install and finishing steps
- `build.sh`: ISO name, boot options, Debian release

## Notes

- The theme hooks download from GitHub during the build, so the build machine needs internet access.
- This is an independent Linux distribution. It copies the look and interaction style of macOS and uses none of Apple's software or logos.
- Not covered: the GDM login screen still uses the stock look, and the installer keeps Debian's Calamares branding.
