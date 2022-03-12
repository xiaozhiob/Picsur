import { Controller, Get } from '@nestjs/common';
import { InfoResponse } from 'picsur-shared/dist/dto/api/info.dto';
import { HostConfigService } from '../../../config/host.config.service';
import { NoAuth } from '../../../decorators/permissions.decorator';

@Controller('api/info')
export class InfoController {
  constructor(private hostConfig: HostConfigService) {}

  @Get()
  @NoAuth()
  getInfo() {
    const response: InfoResponse = {
      demo: this.hostConfig.isDemo(),
      production: this.hostConfig.isProduction(),
    };
    return response;
  }
}
