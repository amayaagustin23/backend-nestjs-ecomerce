import { Module } from '@nestjs/common';
import { ExcelModule } from 'src/services/excel/excel.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { PanelController } from './panel.controller';
import { PanelService } from './panel.service';

@Module({
  imports: [PrismaModule, ExcelModule],
  controllers: [PanelController],
  providers: [PanelService],
  exports: [PanelService],
})
export class PanelModule {}
