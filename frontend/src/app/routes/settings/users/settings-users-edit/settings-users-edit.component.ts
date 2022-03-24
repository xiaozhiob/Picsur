import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { Component, OnInit } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { ActivatedRoute, Router } from '@angular/router';
import { UIFriendlyPermissions } from 'picsur-shared/dist/dto/permissions';
import { DefaultRolesList } from 'picsur-shared/dist/dto/roles.dto';
import { LockedPermsUsersList } from 'picsur-shared/dist/dto/specialusers.dto';
import { HasFailed } from 'picsur-shared/dist/types';
import { UpdateUserControl } from 'src/app/models/forms/updateuser.control';
import { SnackBarType } from 'src/app/models/snack-bar-type';
import { RolesService } from 'src/app/services/api/roles.service';
import { UserManageService } from 'src/app/services/api/usermanage.service';
import { UtilService } from 'src/app/util/util.service';

enum EditMode {
  edit = 'edit',
  add = 'add',
}

@Component({
  selector: 'app-settings-users-edit',
  templateUrl: './settings-users-edit.component.html',
  styleUrls: ['./settings-users-edit.component.scss'],
})
export class SettingsUsersEditComponent implements OnInit {
  readonly separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];

  private mode: EditMode = EditMode.edit;

  model = new UpdateUserControl();

  get adding() {
    return this.mode === EditMode.add;
  }
  get editing() {
    return this.mode === EditMode.edit;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userManageService: UserManageService,
    private utilService: UtilService,
    private rolesService: RolesService
  ) {}

  ngOnInit() {
    Promise.all([this.initUser(), this.initRoles()]).catch(console.error);
  }

  private async initUser() {
    const username = this.route.snapshot.paramMap.get('username');
    if (!username) {
      this.mode = EditMode.add;
      this.model.putRoles(DefaultRolesList);
      return;
    }

    this.mode = EditMode.edit;
    this.model.putUsername(username);

    const user = await this.userManageService.getUser(username);
    if (HasFailed(user)) {
      this.utilService.showSnackBar('Failed to get user', SnackBarType.Error);
      return;
    }

    this.model.putUsername(user.username);
    this.model.putRoles(user.roles);
  }

  private async initRoles() {
    const roles = await this.rolesService.getRoles();
    if (HasFailed(roles)) {
      this.utilService.showSnackBar('Failed to get roles', SnackBarType.Error);
      return;
    }

    this.model.putAllRoles(roles);
  }

  getEffectivePermissions() {
    return this.model
      .getEffectivePermissions()
      .map((permission) => UIFriendlyPermissions[permission]);
  }

  removeRole(role: string) {
    this.model.removeRole(role);
  }

  addRole(event: MatChipInputEvent) {
    const value = (event.value ?? '').trim();
    this.model.addRole(value);
  }

  selectedRole(event: MatAutocompleteSelectedEvent): void {
    this.model.addRole(event.option.viewValue);
  }

  cancel() {
    this.router.navigate(['/settings/users']);
  }

  async updateUser() {
    const data = this.model.getData();

    if (this.adding) {
      const resultUser = await this.userManageService.createUser(data);
      if (HasFailed(resultUser)) {
        this.utilService.showSnackBar(
          'Failed to create user',
          SnackBarType.Error
        );
        return;
      }

      this.utilService.showSnackBar('User created', SnackBarType.Success);
    } else {
      const updateData = data.password
        ? data
        : { username: data.username, roles: data.roles };

      const resultUser = await this.userManageService.updateUser(
        updateData as any
      );
      if (HasFailed(resultUser)) {
        this.utilService.showSnackBar(
          'Failed to update user',
          SnackBarType.Error
        );
        return;
      }

      this.utilService.showSnackBar('User updated', SnackBarType.Success);
    }

    this.router.navigate(['/settings/users']);
  }

  isLockedPerms(): boolean {
    if (this.adding) {
      return false;
    } else {
      return LockedPermsUsersList.includes(this.model.getData().username);
    }
  }
}