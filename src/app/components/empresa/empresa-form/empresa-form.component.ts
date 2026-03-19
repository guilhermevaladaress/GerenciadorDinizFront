import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpresaService } from '../../../services/empresa.service';
import { EmpresaRequestDTO } from '../../../models/empresa-request.dto';
import { EmpresaResponseDTO } from '../../../models/empresa-response.dto';

@Component({
  selector: 'app-empresa-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './empresa-form.component.html',
  styleUrl: './empresa-form.component.css'
})
export class EmpresaFormComponent implements OnChanges {

  @Input() empresa: EmpresaResponseDTO | null = null;
  @Input() modo: 'novo' | 'editar' | 'detalhes' = 'novo';

  @Output() fechar = new EventEmitter<void>();
  @Output() salvo = new EventEmitter<void>();
  @Output() deletado = new EventEmitter<void>();

  dto: EmpresaRequestDTO = this.dtoVazio();
  erros: Record<string, string> = {};
  erroGeral = '';
  salvando = false;

  constructor(private empresaService: EmpresaService) {}

  ngOnChanges(): void {
    this.erros = {};
    this.erroGeral = '';

    if (this.modo === 'editar' && this.empresa) {
      this.dto = {
        nomeFantasia: this.empresa.nomeFantasia,
        razaoSocial: this.empresa.razaoSocial,
        cnpj: this.empresa.cnpj,
        telefone: this.empresa.telefone,
        email: this.empresa.email
      };
    } else {
      this.dto = this.dtoVazio();
    }
  }

  dtoVazio(): EmpresaRequestDTO {
    return {
      nomeFantasia: '',
      razaoSocial: '',
      cnpj: '',
      telefone: '',
      email: ''
    };
  }

  irParaEdicao(): void {
    this.modo = 'editar';
    if (this.empresa) {
      this.dto = {
        nomeFantasia: this.empresa.nomeFantasia,
        razaoSocial: this.empresa.razaoSocial,
        cnpj: this.empresa.cnpj,
        telefone: this.empresa.telefone,
        email: this.empresa.email
      };
    }
  }

  mascaraCnpj(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').substring(0, 14);
    v = v.replace(/^(\d{2})(\d)/, '$1.$2');
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
    this.dto.cnpj = v;
  }

  mascaraTelefone(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').substring(0, 11);
    if (v.length <= 10) {
      v = v.replace(/^(\d{2})(\d)/, '($1) $2');
      v = v.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      v = v.replace(/^(\d{2})(\d)/, '($1) $2');
      v = v.replace(/(\d{5})(\d)/, '$1-$2');
    }
    this.dto.telefone = v;
  }

  validar(): boolean {
    this.erros = {};
    if (!this.dto.nomeFantasia.trim()) this.erros['nomeFantasia'] = 'Nome fantasia é obrigatório.';
    if (!this.dto.razaoSocial.trim()) this.erros['razaoSocial'] = 'Razão social é obrigatória.';
    if (!this.dto.cnpj.trim()) this.erros['cnpj'] = 'CNPJ é obrigatório.';
    if (!this.dto.telefone.trim()) this.erros['telefone'] = 'Telefone é obrigatório.';
    if (!this.dto.email.trim()) this.erros['email'] = 'Email é obrigatório.';
    return Object.keys(this.erros).length === 0;
  }

  salvar(): void {
    if (!this.validar()) return;
    this.salvando = true;
    this.erroGeral = '';

    // Remove máscaras antes de enviar
    const dtoLimpo: EmpresaRequestDTO = {
      ...this.dto,
      cnpj: this.dto.cnpj.replace(/\D/g, ''),
      telefone: this.dto.telefone.replace(/\D/g, '')
    };

    const request = this.modo === 'novo'
      ? this.empresaService.salvar(dtoLimpo)
      : this.empresaService.atualizar(this.empresa!.id!, dtoLimpo);

    request.subscribe({
      next: () => {
        this.salvando = false;
        this.salvo.emit();
      },
      error: () => {
        this.salvando = false;
        this.erroGeral = 'Erro ao salvar empresa. Verifique os dados e tente novamente.';
      }
    });
  }
}