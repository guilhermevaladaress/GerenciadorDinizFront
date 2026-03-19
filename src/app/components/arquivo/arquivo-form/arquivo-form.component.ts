import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArquivoService } from '../../../services/arquivo.service';
import { PastaService } from '../../../services/pasta.service';
import { EmpresaResponseDTO } from '../../../models/empresa-response.dto';
import { PastaResponseDTO } from '../../../models/pasta-response.dto';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-arquivo-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './arquivo-form.component.html',
  styleUrl: './arquivo-form.component.css'
})
export class ArquivoFormComponent implements OnInit {

  @Input() empresas: EmpresaResponseDTO[] = [];
  @Input() pastas: PastaResponseDTO[] = [];

  @Output() fechar = new EventEmitter<void>();
  @Output() salvo = new EventEmitter<void>();

  arquivoSelecionado: File | null = null;
  idEmpresa = 0;
  idPasta = 0;
  pastasFiltradas: PastaResponseDTO[] = [];

  arrastando = false;
  enviando = false;
  progresso = 0;
  erros: Record<string, string> = {};
  erroGeral = '';

  constructor(
    private arquivoService: ArquivoService,
    private pastaService: PastaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.pastasFiltradas = this.pastas;
  }

  onEmpresaChange(): void {
    this.pastasFiltradas = this.pastas.filter(p => p.idEmpresa === this.idEmpresa);
    this.idPasta = 0;
  }

  onArquivoSelecionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.arquivoSelecionado = input.files[0];
      this.erros['arquivo'] = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.arrastando = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.arrastando = false;
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.arquivoSelecionado = files[0];
      this.erros['arquivo'] = '';
    }
  }

  removerArquivo(event: Event): void {
    event.stopPropagation();
    this.arquivoSelecionado = null;
  }

  formatarTamanho(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  validar(): boolean {
    this.erros = {};
    if (!this.arquivoSelecionado) this.erros['arquivo'] = 'Selecione um arquivo.';
    if (!this.idEmpresa || this.idEmpresa === 0) this.erros['idEmpresa'] = 'Empresa é obrigatória.';
    if (!this.idPasta || this.idPasta === 0) this.erros['idPasta'] = 'Pasta é obrigatória.';
    return Object.keys(this.erros).length === 0;
  }

  enviar(): void {
    if (!this.validar() || !this.arquivoSelecionado) return;

    const idUsuario = this.authService.getUsuarioId();
    if (!idUsuario) {
      this.erroGeral = 'Usuário não identificado. Faça login novamente.';
      return;
    }

    this.enviando = true;
    this.erroGeral = '';

    // Simula progresso visual
    const intervalo = setInterval(() => {
      if (this.progresso < 85) this.progresso += 10;
    }, 200);

    this.arquivoService.upload(
      this.arquivoSelecionado,
      this.idEmpresa,
      idUsuario,
      this.idPasta
    ).subscribe({
      next: () => {
        clearInterval(intervalo);
        this.progresso = 100;
        setTimeout(() => {
          this.enviando = false;
          this.progresso = 0;
          this.salvo.emit();
        }, 500);
      },
      error: () => {
        clearInterval(intervalo);
        this.enviando = false;
        this.progresso = 0;
        this.erroGeral = 'Erro ao enviar arquivo. Tente novamente.';
      }
    });
  }
}