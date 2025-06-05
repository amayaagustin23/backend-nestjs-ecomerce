import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { PanelController } from './panel.controller';
import { PanelService } from './panel.service';

@Module({
  imports: [PrismaModule],
  controllers: [PanelController],
  providers: [PanelService],
  exports: [PanelService],
})
export class PanelModule {}
