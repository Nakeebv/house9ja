import { Controller, Post, Body } from '@nestjs/common';
import { InquiriesService, CreateInquiryDto } from './inquiries.service';

@Controller('inquiries')
export class InquiriesController {
  constructor(private s: InquiriesService) {}

  @Post()
  create(@Body() body: CreateInquiryDto) {
    return this.s.create(body);
  }
}
