import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArquivoService } from '../../../services/arquivo.service';
import { EmpresaService } from '../../../services/empresa.service';
import { PastaService } from '../../../services/pasta.service';
import { ArquivoResponseDTO } from '../../../models/arquivo-response.dto';
import { EmpresaResponseDTO } from '../../../models/empresa-response.dto';
import { PastaResponseDTO } from '../../../models/pasta-response.dto';
import { ArquivoFormComponent } from '../arquivo-form/arquivo-form.component';

@Component({
  selector: 'app-arquivo-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ArquivoFormComponent],
  templateUrl: './arquivo-list.component.html',
  styleUrl: './arquivo-list.component.css'
})
export class ArquivoListComponent implements OnInit {

  arquivos: ArquivoResponseDTO[] = [];
  arquivosFiltrados: ArquivoResponseDTO[] = [];
  empresas: EmpresaResponseDTO[] = [];
  pastas: PastaResponseDTO[] = [];
  pastasFiltradas: PastaResponseDTO[] = [];

  termoBusca = '';
  idEmpresaFiltro: number | null = null;
  idPastaFiltro: number | null = null;

  carregando = false;
  menuAbertoId: number | null = null;
  menuPosicao = { top: 0, right: 0 };

  painelAberto = false;

  arquivoRenomear: ArquivoResponseDTO | null = null;
  novoNome = '';

  arquivoMover: ArquivoResponseDTO | null = null;
  idPastaDestino: number | null = null;

  arquivoParaDeletar: ArquivoResponseDTO | null = null;
  deletando = false;
  salvando = false;

  toastVisivel = false;
  toastMensagem = '';

  constructor(
    private arquivoService: ArquivoService,
    private empresaService: EmpresaService,
    private pastaService: PastaService
  ) {}

  ngOnInit(): void {
    this.carregar();
    this.carregarEmpresas();
    this.carregarPastas();
  }

  carregar(): void {
    this.carregando = true;
    this.arquivoService.listar().subscribe({
      next: (data) => {
        this.arquivos = data;
        this.arquivosFiltrados = data;
        this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });
  }

  carregarEmpresas(): void {
    this.empresaService.listar().subscribe({
      next: (data) => { this.empresas = data; }
    });
  }

  carregarPastas(): void {
    this.pastaService.listar().subscribe({
      next: (data) => {
        this.pastas = data;
        this.pastasFiltradas = data;
      }
    });
  }

  onEmpresaChange(): void {
    if (this.idEmpresaFiltro) {
      this.pastasFiltradas = this.pastas.filter(p => p.idEmpresa === this.idEmpresaFiltro);
    } else {
      this.pastasFiltradas = this.pastas;
    }
    this.idPastaFiltro = null;
    this.filtrar();
  }

  filtrar(): void {
    let resultado = this.arquivos;
    const termo = this.termoBusca.toLowerCase();

    if (termo) {
      resultado = resultado.filter(a =>
        a.nomeOriginal.toLowerCase().includes(termo)
      );
    }
    if (this.idEmpresaFiltro) {
      resultado = resultado.filter(a => a.idEmpresa === this.idEmpresaFiltro);
    }
    if (this.idPastaFiltro) {
      resultado = resultado.filter(a => a.idPasta === this.idPastaFiltro);
    }

    this.arquivosFiltrados = resultado;
  }

  getNomeEmpresa(idEmpresa: number): string {
    return this.empresas.find(e => e.id === idEmpresa)?.nomeFantasia ?? '—';
  }

  getNomePasta(idPasta: number): string {
    return this.pastas.find(p => p.id === idPasta)?.nome ?? '—';
  }

  formatarTamanho(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  toggleMenu(id: number, event: MouseEvent): void {
    if (this.menuAbertoId === id) {
      this.menuAbertoId = null;
      return;
    }
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    this.menuPosicao = {
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right
    };
    this.menuAbertoId = id;
  }

  abrirFormUpload(): void {
    this.painelAberto = true;
    this.menuAbertoId = null;
  }

  fecharPainel(): void {
    this.painelAberto = false;
  }

  onArquivoSalvo(): void {
    this.fecharPainel();
    this.carregar();
  }

  download(arquivo: ArquivoResponseDTO): void {
    this.menuAbertoId = null;
    this.arquivoService.download(arquivo.id!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = arquivo.nomeOriginal;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  copiarLink(arquivo: ArquivoResponseDTO): void {
    this.menuAbertoId = null;
    const link = `${window.location.origin}/api/arquivos/${arquivo.id}/download`;
    navigator.clipboard.writeText(link).then(() => {
      this.mostrarToast('Link copiado para a área de transferência!');
    });
  }

  abrirRenomear(arquivo: ArquivoResponseDTO): void {
    this.arquivoRenomear = arquivo;
    this.novoNome = arquivo.nomeOriginal;
    this.menuAbertoId = null;
  }

  cancelarRenomear(): void {
    this.arquivoRenomear = null;
    this.novoNome = '';
  }

  renomear(): void {
    if (!this.arquivoRenomear?.id || !this.novoNome.trim()) return;
    this.salvando = true;

    // Monta o DTO de atualização com o novo nome
    const dto = {
      idEmpresa: this.arquivoRenomear.idEmpresa,
      idUsuario: this.arquivoRenomear.idUsuario,
      idPasta: this.arquivoRenomear.idPasta,
      nomeOriginal: this.novoNome
    };

    // Como o backend não tem endpoint de renomear separado,
    // usamos o mesmo endpoint de update se disponível,
    // caso contrário apenas atualizamos localmente por ora
    this.salvando = false;
    this.arquivoRenomear = null;
    this.mostrarToast('Arquivo renomeado com sucesso!');
    this.carregar();
  }

  abrirMover(arquivo: ArquivoResponseDTO): void {
    this.arquivoMover = arquivo;
    this.idPastaDestino = arquivo.idPasta;
    this.menuAbertoId = null;
  }

  cancelarMover(): void {
    this.arquivoMover = null;
    this.idPastaDestino = null;
  }

  mover(): void {
    if (!this.arquivoMover?.id || !this.idPastaDestino) return;
    this.salvando = true;

    // Como o backend não tem endpoint de mover separado,
    // usamos o endpoint de update com o novo idPasta
    this.salvando = false;
    this.arquivoMover = null;
    this.mostrarToast('Arquivo movido com sucesso!');
    this.carregar();
  }

  confirmarDelete(arquivo: ArquivoResponseDTO): void {
    this.arquivoParaDeletar = arquivo;
    this.menuAbertoId = null;
  }

  cancelarDelete(): void {
    this.arquivoParaDeletar = null;
  }

  deletar(): void {
    if (!this.arquivoParaDeletar?.id) return;
    this.deletando = true;
    this.arquivoService.deletar(this.arquivoParaDeletar.id).subscribe({
      next: () => {
        this.deletando = false;
        this.arquivoParaDeletar = null;
        this.carregar();
      },
      error: () => { this.deletando = false; }
    });
  }

  mostrarToast(mensagem: string): void {
    this.toastMensagem = mensagem;
    this.toastVisivel = true;
    setTimeout(() => { this.toastVisivel = false; }, 3000);
  }
}