export type FieldType = 'text'|'number'|'date'|'list'|'url'|'boolean'|'select';
export type Value = string|number|boolean|string[]|null;
export interface Field {id:string;label:string;type:FieldType;min?:number;max?:number;suffix?:string;categories?:string[];options?:string[]}
export interface Category {id:string;label:string}
export type Mode = 'academic'|'personal';
export interface Post {latex?:string;latexPdf?:boolean;latexMain?:string;latexEngine?:'pdflatex'|'xelatex'|'lualatex';modes?:Mode[];id:string;title:string;date:string;type:string;draft:boolean;body:string;properties:Record<string,Value>}
export interface GalleryItem {id:string;title:string;type:'artwork'|'photography';medium:string;date:string;image:string;alt:string;description?:string;featured?:boolean}
export interface View {fields:string[];hideEmpty:boolean}
export interface Config {categories:Category[];fields:Field[]}
export interface Views {home:View;writing:View;article:View;byCategory:Record<string,View>}
export interface Education {institution:string;degree?:string;dates?:string}
export interface Paper {id:string;title:string;authors?:string;venue?:string;year?:number;summary?:string;pdf?:string;code?:string;url?:string;bibtex?:string}
export interface Profile {bio:string;description:string;portrait:string;portraitAlt:string;email?:string}
export interface AcademicProfile extends Profile {cv?:string;github?:string;education:Education[];papers:Paper[]}
export interface PersonalProfile extends Profile {contact:string;homeGalleryLimit:number}
export interface Site {name:string;homeWritingLimit:number;modeCategories:Record<Mode,string[]>;academic:AcademicProfile;personal:PersonalProfile}
export interface Data {site:Site;config:Config;views:Views;posts:Post[];gallery:GalleryItem[]}
export interface Repository {load():Promise<Data>}
export interface Property {id:string;label:string;value:string;type:FieldType;empty:boolean}
