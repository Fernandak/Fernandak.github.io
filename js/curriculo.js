function getToken(content, index) {
	var token = "";
	if (content[index] == "\\") {
		do {
			token += content[index];
			index++;
		} while (content[index] != "(" && content[index] != "\\" && content[index] != "{");
		return { strToken : token, indexEnd : index - 1};	
	} else {
		return undefined;	
	}				
}

function getParameter(content, index) {
	var token = "";
	index++;
	if (content[index] == "("){
		do {
			token += content[index];
			index++;
		} while (content[index] != ")");
		return { strToken : token.substring(1), indexEnd : index};	
	}

	console.error("Erro de sintaxe");				
}

function getContent(content, index) {
	var token = "";
	index++;
	if (content[index] == "{"){
		do {
			token += content[index];
			index++;
		} while (content[index] != "}");
		return { strToken : token.substring(1), indexEnd : index};	
	}

	console.error("Erro de sintaxe");					
}



function newProp() {
	return {color : stackProperties[0].color, background : stackProperties[0].background, editable : false};
}


function parser(content, index){
	var p = new newProp();	

	var parameter;
	var token;
	do {
		token = getToken(content, !parameter ? index : parameter.indexEnd + 1);
		if (token != undefined){						
			if (token.strToken == "\\color") {
				parameter = getParameter(content, token.indexEnd);					
				p.color = parameter.strToken;							
		
			} else if (token.strToken == "\\background") {
				parameter = getParameter(content, token.indexEnd);					
				p.background = parameter.strToken;							
			} else if (token.strToken == "\\editable") {
				parameter = getParameter(content, token.indexEnd);				
				p.editable = parameter.strToken == "true";
			} else if (token.strToken == "\\tab") {
				parameter = getParameter(content, token.indexEnd);				
				p.tab = parameter.strToken;
			}
		} else {
			break;
		}					
	} while(true);
	

	var conteudo = getContent(content, parameter.indexEnd);

	return {Content : conteudo,  Position : conteudo.indexEnd + 1, Prop : p};
}

function createSpan(el) {
	var span = document.createElement('span');
	el.appendChild(span);
	stackSpan.unshift(span);
}

function addStack(el, prop, indexEndStack) {
	stackProperties.unshift(prop);
	stack.unshift(indexEndStack);			
	createSpan(el);
}

var fator = 0.3;

var stackSpan = [];

function writeSlowly(el, str, timeout, speed, callInit, callback) {
	var position = 0;
	setTimeout(function() {
		if(typeof(callInit) == 'function')
			callInit();

		var idInterval = setInterval(function() {

			if (str[position] == "$"){
				var parsed = parser(str, position + 1);													
				var comando = str.substr(position, parsed.Position - position);
				str = str.replace(comando, parsed.Content.strToken);	
				addStack(el, parsed.Prop, parsed.Content.strToken.length +  position);
			}

			var char = str && str.length > 0 ?  (str[position] == '\n' ? '<br>' : str[position]) : '';
			
			if (stackSpan.length <=  0)
				createElement(el);

			var span = stackSpan[0];

			span.innerHTML += char;
			span.style.color = stackProperties[0].color;
			span.style.background = stackProperties[0].background;
			span.style.paddingLeft = stackProperties[0].tab + "px";
			span.setAttribute("contenteditable", stackProperties[0].editable);

			//Desce Scroll Da Pagina automaticamente
			document.body.scrollTop = document.body.scrollHeight;

			position++;
			if (stack.length > 0) {
				if (stack[0] == position){
					stackProperties.shift();
					stack.shift();
					createSpan(el);
				}
			}

			
			if(position == str.length) {
				clearInterval(idInterval);
				if(typeof(callback) == 'function')
					callback();
			}
		}, (speed || 30) * fator);
	}, timeout * fator);
}

function erase(el, size, timeout, speed, callback) {
	var amountErase = 0;
	setTimeout(function() {
		var idInterval = setInterval(function() {
			
			var span = stackSpan[0];
			if (span.innerHTML.length <= 0){
				stackSpan.shift();
			} else {
				span.innerHTML = span.innerHTML.slice(0, -1);
			}
		
			amountErase++;
			if(amountErase == size) {
				clearInterval(idInterval);
				if(callback && typeof(callback) == 'function')
					callback();
			}
		}, (speed || 75) * fator);
	}, timeout * fator);
}

function writeListText(el, objStr, callInit, callback, position, last) {
	position = position ? position : 0;

	writeSlowly(el, objStr[position].text, objStr[position].timeout, objStr[position].speed, callInit, function() {
		var objErase = objStr[position].erase || null;

		callback();

		if(objErase) {
			erase(el, objErase.size, objErase.timeout, objErase.speed, function() {
				position++;
				if(objStr[position])
					writeListText(el, objStr, callInit, callback, position, last);
				else
					last();
			});
		} else {
			position++;
			if(objStr[position])
				writeListText(el, objStr, callInit, callback, position, last);
			else
				last();
		}
	});
}

var stack = [];
var stackProperties = [];


function writeRecursive(el, assinatura, vetor, index) {
	if (index < vetor.length){

		function fnInit() { document.getElementById('pointer').classList.remove('animation'); };
		function fnEnd() {document.getElementById('pointer').classList.add('animation'); };
		function fnEndList() {  writeRecursive(el,  assinatura, vetor, index + 1); };

		writeSlowly(el, vetor[index].assinatura ? (index > 0 ? '\n' : '') + assinatura : '\n ', 1, 1, function() {}, function() {
			writeListText(el, vetor[index].conteudo,
				fnInit,
				fnEnd,
				0,
				fnEndList
			);
		});	
	}				
}



window.onload = function() {
	stackProperties.unshift({color : "#00FF00", background : "#", editable : false, tab: 0});
	stackSpan.unshift(document.createElement('span'));

	var el = document.getElementById('txt');
	el.appendChild(stackSpan[0]);
	var assinatura = ">";



	var intro = [
		{text: ' Olá!', timeout: 4000,  speed: 80},
		{text: ' Eu me chamo $\\color(white)\\background(red)\\color(yellow){Fernanda}.', timeout: 1500,  speed: 80},
		{text: ' Seja bem vindo ao meu currículo.', timeout: 1000,  speed: 80},
		{text: ' ', timeout: 1, erase: {size: 58, timeout: 4000, speed: 35},  speed: 80},
		{text: 'ls', timeout: 1000,  speed: 90, computer: true}
	];

	var ls = [
		{text: '$\\color(cyan){resumo}', timeout: 1,  speed: 1},	
		{text: '\n$\\color(cyan){formacao}', timeout: 1,  speed: 1},	
		{text: '\n$\\color(cyan){habilidades}', timeout: 1,  speed: 1},
		{text: '\n$\\color(cyan){experiencia}', timeout: 1,  speed: 1},
	];

	var resumo = [
		{text: '.\\resumo', timeout: 1000,  speed: 90},
		{text: '\n$\\background(red)\\color(white){[RESUMO]}', timeout: 1000},
		{text: '\n$\\color(purple){FERNANDA PEREIRA FERREIRA}', timeout: 1},
		{text: '\n$\\color(brown)\\tab(20){>FERNANDAKNF@GMAIL.COM}', timeout: 1},
		{text: '\n$\\tab(20){22 ANOS}, $\\color(white){BRASILEIRA}', timeout: 1},					
		{text: '\n$\\tab(20){PARNAMIRIM-RN}', timeout: 1}
	];


	//TODO - dir para listar os campos
	var formacao = [
		{text: '.\\formacao', timeout: 2000, speed: 90},
		{text: '\n$\\background(red)\\color(white){[FORMAÇÃO]}', timeout: 1000},
		{text: '\nANÁLISE E DESENVOLVIMENTO DE SISTEMAS (QUARTO SEMESTRE)\n UNIVERSIDADE NOVE DE JULHO ($\\color(blue){UNINOVE})', timeout: 50}
	];

	var habilidades = [
		{text: '.\\habilidades', timeout: 2000, speed: 90},
		{text: '\n$\\background(red)\\color(white){[HABILIDADES]}', timeout: 1000},
		{text: '\nINGLÊS BÁSICO',  timeout: 1,  speed: 1},
		{text: '\nHTML',  timeout: 1,  speed: 1},
		{text: '\nCSS',  timeout: 1,  speed: 1},
		{text: '\nJAVASCRIPT',  timeout: 1,  speed: 1},
		{text: '\nGIT',  timeout: 1,  speed: 1},
		{text: '\nMySQL',  timeout: 1,  speed: 1},		
		{text: '\nLINUX',  timeout: 1,  speed: 1}		
	];


	var experiencia = [ 
		{text: '.\\experiencia', timeout: 2000, speed: 90},
		{text: '\n$\\background(red)\\color(white){[EXPERIÊNCIAS]}', timeout: 1000},
      	{text: '\n$\\color(pink){[FREE LANCE]} - SÃO PAULO/SP', timeout: 1, speed: 1},
      	{text: '\n$\\tab(20){JULHO/2018} ', timeout: 1, speed: 1},
      	{text: '\n$\\tab(20){DESENVOLVIMENTO EM:} $\\color(red){[NODEJS]}, $\\color(red){[REACT]}', timeout: 1, speed: 1}            
	];
  

  
  	var interacao = [
		{text: ' ', timeout: 1, speed: 1},
  	];
	

	var vetor = [	
		{assinatura : true, conteudo: intro},
		{assinatura : false, conteudo: ls},
		{assinatura : true, conteudo: resumo},
		{assinatura : true, conteudo: formacao},
		{assinatura : true, conteudo: habilidades},
		{assinatura : true, conteudo: experiencia},
  		//{assinatura : true, conteudo: academico},
  		{assinatura : true, conteudo: interacao}
      			
	];

	writeRecursive(el, assinatura, vetor, 0);		
}
