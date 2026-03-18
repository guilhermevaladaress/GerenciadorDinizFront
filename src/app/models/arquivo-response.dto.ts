// model/arquivo-response.dto.ts
import { TipoArquivo } from './enums/tipo-arquivo.enum';

export interface ArquivoResponseDTO {
  id: number;
  nome: string;
  nomeOriginal: string;
  tamanho: number;
  tipoArquivo: TipoArquivo;
  caminho: string;
  idEmpresa: number;
  idUsuario: number;
  idPasta: number;
}