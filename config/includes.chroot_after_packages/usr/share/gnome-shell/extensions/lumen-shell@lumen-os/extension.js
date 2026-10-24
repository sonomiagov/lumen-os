// Lumen Shell: gives GNOME Shell a macOS-like top bar.
//   left : system menu (About, Settings, Sleep, Restart, Shut Down...) + focused app name
//   right: status icons, then the clock/date as the right-most item
//   hidden: the Activities button (Super / Super+Space still open the overview)

import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Shell from 'gi://Shell';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

function run(cmd) {
    try {
        GLib.spawn_command_line_async(cmd);
    } catch (e) {
        console.error(`lumen-shell: could not run "${cmd}": ${e}`);
    }
}

const SystemMenu = GObject.registerClass(
class LumenSystemMenu extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Lumen menu', false);

        this.add_child(new St.Icon({
            icon_name: 'start-here-symbolic',
            style_class: 'system-status-icon lumen-logo',
        }));

        const add = (label, cmd) => {
            const item = new PopupMenu.PopupMenuItem(label);
            item.connect('activate', () => run(cmd));
            this.menu.addMenuItem(item);
        };
        const separator = () => this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        add('About This Computer', 'gnome-control-center about');
        separator();
        add('System Settings…', 'gnome-control-center');
        add('Software Store…', 'gnome-software');
        separator();
        add('Force Quit…', 'gnome-system-monitor');
        separator();
        add('Sleep', 'systemctl suspend');
        add('Restart…', 'systemctl reboot');
        add('Shut Down…', 'systemctl poweroff');
        separator();
        add('Lock Screen', 'loginctl lock-session');
        add('Log Out…', 'gnome-session-quit --logout --no-prompt');
    }
});

export default class LumenShell extends Extension {
    enable() {
        this._menu = new SystemMenu();
        Main.panel.addToStatusArea('lumen-menu', this._menu, 0, 'left');

        // Focused application name, bold, like the macOS app menu title.
        this._tracker = Shell.WindowTracker.get_default();
        this._appLabel = new St.Label({
            text: 'Desktop',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'lumen-app-name',
        });
        this._appBin = new St.Bin({child: this._appLabel});
        Main.panel._leftBox.add_child(this._appBin);
        this._focusId = this._tracker.connect('notify::focus-app', () => this._updateApp());
        this._updateApp();

        this._apply();
        // The shell rebuilds the panel when the session mode changes (lock/unlock).
        this._sessionId = Main.sessionMode.connect('updated', () => this._apply());
    }

    disable() {
        if (this._sessionId) {
            Main.sessionMode.disconnect(this._sessionId);
            this._sessionId = null;
        }
        if (this._focusId) {
            this._tracker.disconnect(this._focusId);
            this._focusId = null;
        }

        const activities = Main.panel.statusArea.activities;
        if (activities) {
            if (this._activitiesId) {
                activities.container.disconnect(this._activitiesId);
                this._activitiesId = null;
            }
            activities.container.show();
        }

        const dateMenu = Main.panel.statusArea.dateMenu;
        if (dateMenu) {
            const parent = dateMenu.container.get_parent();
            if (parent)
                parent.remove_child(dateMenu.container);
            Main.panel._centerBox.add_child(dateMenu.container);
        }

        this._appBin?.destroy();
        this._appBin = null;
        this._appLabel = null;
        this._menu?.destroy();
        this._menu = null;
        this._tracker = null;
    }

    _updateApp() {
        const app = this._tracker?.focus_app;
        if (this._appLabel)
            this._appLabel.text = app ? app.get_name() : 'Desktop';
    }

    _apply() {
        const activities = Main.panel.statusArea.activities;
        if (activities) {
            activities.container.hide();
            if (!this._activitiesId) {
                this._activitiesId = activities.container.connect('notify::visible', () => {
                    if (activities.container.visible)
                        activities.container.hide();
                });
            }
        }

        const dateMenu = Main.panel.statusArea.dateMenu;
        if (dateMenu && dateMenu.container.get_parent() !== Main.panel._rightBox) {
            const parent = dateMenu.container.get_parent();
            if (parent)
                parent.remove_child(dateMenu.container);
            Main.panel._rightBox.add_child(dateMenu.container);
        }
    }
}
