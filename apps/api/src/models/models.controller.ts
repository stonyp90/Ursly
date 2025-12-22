import { Controller, Get, Post, Delete, Body, Param, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ModelsService } from './models.service';
import { PullModelDto } from './dto';

@ApiTags('Models')
@Controller('models')
@ApiBearerAuth()
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  @ApiOperation({ summary: 'List available models' })
  @ApiResponse({ status: 200, description: 'Models retrieved successfully' })
  async list() {
    return this.modelsService.listModels();
  }

  @Post('pull')
  @ApiOperation({ summary: 'Pull/download a model' })
  @ApiResponse({ status: 200, description: 'Model pull started' })
  async pull(@Body() dto: PullModelDto) {
    return this.modelsService.pullModel(dto);
  }

  @Sse('pull-stream')
  @ApiOperation({ summary: 'Stream model pull progress' })
  pullStream(@Body() dto: PullModelDto): Observable<MessageEvent> {
    return this.modelsService.pullModelStream(dto);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a model' })
  @ApiResponse({ status: 200, description: 'Model deleted successfully' })
  async delete(@Param('name') name: string) {
    return this.modelsService.deleteModel(name);
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get model information' })
  @ApiResponse({ status: 200, description: 'Model info retrieved' })
  async show(@Param('name') name: string) {
    return this.modelsService.showModel(name);
  }
}

