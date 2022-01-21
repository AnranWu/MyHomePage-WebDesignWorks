(function($){
	
	//
	$.fn.ZoomVisualizer = function( method )
	{
		
		//
		var methods =
		{
			init :										function( options ){ 			return this.each(function(){	_init(this, options);});}
		};

		var defaults =
		{
			object					: null,
			resizeInitial			: false,// redimensiona ou não a imagem em zoom
			sliderOrientation		: "horizontal",
			positionZoom			: {left:0,right:0,top:0,bottom:0},//margem para a mascara do zoom na tela
			centerThumbs			: false,
			loader					: "",
			added					: function() {},
			removed					: function() {}
		};
		
		var _this;
		var _imageLoad;//nome da imagem a ser carregada
		var _data;//dados 
		var _wrapperResize;//objeto a ser redimensionado/ movimentado
		var _originalWidth;
		var _originalHeight;
		var _wrapper;
		var hDragMove;
		var btZoomIn;
		var btZoomOut;
		var posDragMove = 0;
		var moveDrag = 2;
		var firstLoad;
		var wrapper_geral;
		var scaleResize = 1;
		var index_ativo = 0;
		var plugin_settings;		
		
		// Method calling logic
		if ( methods[method] )//caso exista um método, esse método é chamado
		{
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		}
		else if ( typeof method === 'object' || ! method )//caso não exista um método ou seja apenas passado o objeto
		{
			return methods.init.apply( this, arguments );
		}
		else//caso o método não exista
		{
		  $.error( 'Method ' +  method + ' does not exist on ZoomVisualizer' );
		} 

		function _init($this, options)
		{
			
			var $this 						= $($this);
					
			var options 					= $.extend(defaults, options);
			plugin_settings 				= options;
			$this.data(options);
			
			_this = $this;
			
			var data 						= $this.data();
			
			if(options.object == '')
			{
				alert('The object is empty!!!!');
			}
			else
			{
				initialize($this);
			}
		}
		
		function initialize($this)
		{
						
			_data = $this.data();
			
			wrapper_geral = $(_data.object);
			
			wrapper_geral.fadeIn(400);
			
			plugin_settings.added.call(this, { object:wrapper_geral});
			
			//prevent body from scroll
			jQuery(document.body).css('overflow', 'hidden');
	
			_imageLoad = wrapper_geral.find(".wrapper img").attr("src");
			_wrapper = wrapper_geral.find(".wrapper");
			
			btZoomIn = $(wrapper_geral.find(".zoom-in"));
			btZoomIn.click(zoomIn);
			
			btZoomOut = $(wrapper_geral.find(".zoom-out"));
			btZoomOut.click(zoomOut);
			
			//posiciona a imagem do zoom
			$(".content",wrapper_geral).css({top:_data.positionZoom.top,left:_data.positionZoom.left});
			
			//
			wrapper_geral.addClass(_data.sliderOrientation);
			
			//posiciona os thumbs caso centerThumbs == true
			if(_data.centerThumbs == true)
			{
				var _width = 0;
				
				$('#listagem-imagens a',wrapper_geral).each(function(index,value)
				{
					_width += $(this).outerWidth(true);
				});
				
				if(_width > $(window).width())
				{
					$('#listagem-imagens > div',wrapper_geral).width(_width+5);
					$('#listagem-imagens',wrapper_geral).css({ overflow:"scroll"});
					_width = $(window).width() - 10;
				}
				
				$('#listagem-imagens',wrapper_geral).width(_width+5);
				$('#listagem-imagens',wrapper_geral).css({ margin:'0 auto'});
			}
			
			//oculta footer e as setas caso tenha apenas um item no zoom
			if($('#listagem-imagens a',wrapper_geral).size() == 1)
			{
				$(".footer",wrapper_geral).remove();
				$(".content #next",wrapper_geral).hide();
				$(".content #before",wrapper_geral).hide();
			}
			
			if(_data.sliderOrientation == "vertical") 
			{
				$(".tooltip-caller",wrapper_geral).mouseenter(function(){
					var _tooltip = $(".tooltip", $(this).parent());
					
					_tooltip.css({display:'block',opacity:0});
					
					if(!_tooltip.hasClass('positioned')){
						_tooltip.addClass('positioned');
						_tooltip.css({left:-$("p",_tooltip).outerWidth(true)-10, width:$("p",_tooltip).outerWidth(true)});
					}
					
					_tooltip.animate({opacity:1},80);
				});
				
				$(".tooltip-caller",wrapper_geral).mouseleave(function(){
					var _tooltip = $(".tooltip", $(this).parent());
					_tooltip.hide(100);					
				});
			}
			
			//---------------------------------
			//drag zoom
			//----------
			var _drag = wrapper_geral.find("#barra #scroll");//barra
			var _box = wrapper_geral.find("#barra");
			
			hDragMove = (_data.sliderOrientation == "horizontal") ? _box.width()-_drag.width() : _box.height()-_drag.height();
			
			var _axis = (_data.sliderOrientation == "horizontal") ? 'x' : 'y';
			
			_drag.draggable({
				axis: _axis,
				containment: 'parent',
				cursor: 'pointer',
				appendTo: 'body',
				scroll: false,
				drag: function(event, ui)
				{
					reposImage();
				},
				start: function(event, ui)
				{
					_box.parent().parent().mouseleave(
						function()
						{
							$('.ui-draggable-dragging',wrapper_geral).draggable( 'option',  'revert', false ).trigger('mouseup');
						}
					);
				},
				stop: function(event, ui)
				{
					//box.parent().parent().unbind();
				}
			});
			
			//---------------------
			//move image with mouse wheel
			/*_wrapper.bind('mousewheel',
				function(event, delta)
				{
					if(_wrapperResize){
						//-----------------------------------
						var posDrag = parseFloat(getSize(_drag,"left"));
						var pctBox = (_wrapper.height()/_wrapperResize.height())*5;
						var _rate = 1;
						
						if(posDrag-(delta*_rate*pctBox) >= 0 && posDrag-(delta*_rate*pctBox) <= hDragMove)
						{
							_drag.css('left',(posDrag-(delta*_rate*pctBox))+"px");
						}else{
							if(posDrag-(delta*_rate) < 0)
							{
								_drag.css('left',"0px");
							}
							
							if(posDrag-(delta*_rate) > hDragMove)
							{
								_drag.css('left',hDragMove+"px");
							}
						}
						
						reposImage();
					}
					//-----------------------------------
					return false;
				}
			);*/
			
			//-----------------------------
			var _btFechar = $(wrapper_geral.find(".fechar"));//barra
			
			_btFechar.click(
				function () {
					$(_data.object).animate({opacity:0},300,function(){	$(_data.object).remove();destroy();});
					jQuery(document.body).css('overflow', 'auto');
					return false;
				}
			);
			
			initListaThumbs();//inicia a lista com os thumbs
			loadImage();//carrega imagem
			initSetas();//inicia as setas
			initAbaMinimizar();
			moveImage();	
			
			//redimensionamento do browser
			$(window).resize(resizeHandler);
			resizeHandler();
				
		}//end initialize
		
		function moveImage ()
		{
			//$( "#zoom-visualizer .wrapper" ).mousemove(function( event ) {
			  //console.log ( event.clientX + ", " + event.clientY);
			//});
			$(".wrapper",wrapper_geral).mousemove(function (e) {
				//http://www.quirksmode.org/js/events_properties.html
				//getting current mouse position
				
				var posx = 0;
				var posy = 0;
				
				posx = e.clientX;
				posy = e.clientY; 
				
				var _left = getSize($(this).parent(),'left');
				var _top = getSize($(this).parent(),'top');
				
				posx = posx - _left;
				posy = posy - _top;
				
				//------------------
				//movimento da imagem
				//------------------
				
				var _thumb = $(".dragme",$(this));
				
				var _mouseY = posy;
				var _mouseX = posx;
				
				var ctposY = getSize(_thumb,'top');
				var ctposX = getSize(_thumb,'left');
				
				var widthMask = $(this).width();
				var heightMask = $(this).height();
				
				var xTemp = (_mouseX/widthMask)*((widthMask- _thumb.width()));
				var dgmX = (xTemp-ctposX)/5;
				
				var yTemp = (_mouseY/heightMask)*((heightMask - _thumb.height()));
				var dgmY = (yTemp-ctposY)/5;
				
				if(_thumb.height()>heightMask)
				{					
					if (dgmY < -0.050000 || dgmY > 0.050000)
						_thumb.css({top:(ctposY + dgmY)});
				}
				
				if(_thumb.width()>widthMask)
				{					
					if (dgmX < -0.050000 || dgmX > 0.050000)
						_thumb.css({left:(ctposX + dgmX)});
				}
				
				//------------------
				//------------------
				
			});
			
		}
		
		function getSize(_obj,_css)
		{
			var _regExp = new RegExp("[a-z][A-Z]","g");
			return parseFloat(_obj.css(_css).replace(_regExp, ""));
		}
		
		function initAbaMinimizar () {
			$("#aba-lista",wrapper_geral).click(function(){
				//---------------
				if($(".footer",wrapper_geral).hasClass("closed")){
					$(this).find("span").text("Ocultar miniaturas");
					$(".footer",wrapper_geral).animate({height:135},0);
					$("#listagem-imagens",wrapper_geral).show();
					$(" .footer",wrapper_geral).removeClass("closed");
				}else{
					$(this).find("span").text("Show Thumbnails");
					$(".footer",wrapper_geral).animate({height:10},0);
					$("#listagem-imagens",wrapper_geral).hide();
					$(".footer",wrapper_geral).addClass("closed");
				}
				resizeHandler();
				reposImage ();	
				//--------------
				return false;
			});
		}
		
		function destroy () {
						
			//--------
			_this = null;
			_imageLoad = null;//nome da imagem a ser carregada
			_data = null;//dados 
			_wrapperResize = null;//objeto a ser redimensionado/ movimentado
			_originalWidth = null;
			_originalHeight = null;
			_wrapper = null;
			hDragMove = null;
			btZoomIn = null;
			btZoomOut = null;
			posDragMove = 0;
			moveDrag = 2;
			firstLoad = null;
			wrapper_geral = null;
			scaleResize = 1;
			index_ativo = 0;
			
			plugin_settings.removed.call(this, {});
		}
			
		//--------------------
		function initListaThumbs () {
			
			//item-zoom-image
			$(wrapper_geral.find(".footer .item-zoom-image")).each(function(index, element) {
				
				if(index == index_ativo){
					$(element).addClass('ativo');
				}
				
				$(element).attr("alt",index);
				
				$(element).click(function(){
									
					if(!$(element).hasClass("ativo")){
						
						index_ativo = $(this).attr("alt");
						changeImage({bt:$(this)});
					
					}//end if
					
					return false;
				});//end click
			});//end each
		
		}//end lista thumbs
		
		function changeImage (obj_){
			if(wrapper_geral.find(".footer .ativo").size()>0){
				wrapper_geral.find(".footer .ativo").removeClass("ativo");
			}
			
			obj_.bt.addClass("ativo");
		
			_wrapperResize.fadeOut(300,function(){
				_wrapperResize.remove();
				_wrapperResize = null;
				
				_imageLoad = obj_.bt.attr("href");
				
				loadImage ();
			});
		}
		
		function initSetas () {
			
			var _setaEsq = $(wrapper_geral.find("#before"));
			var _setaDir = $(wrapper_geral.find("#next"));
			
			var _length = $(wrapper_geral.find(".footer .item-zoom-image")).length;
			
			if(_length==1){
				_setaDir.hide();
				_setaEsq.hide();
			}
			
			_setaDir.click(function(){
				if(index_ativo < _length-1){
					index_ativo++;
				}else{
					index_ativo = 0;
				}
				changeImageBySeta ();
				//-------
				return false;
			});
			
			_setaEsq.click(function(){
				if(index_ativo == 0){
					index_ativo = _length-1;
				}else{
					index_ativo --;
				}
				changeImageBySeta ();
				//-------
				return false;
			});
		
		}//end init setas
		
		function changeImageBySeta () {
			$(wrapper_geral.find(".footer .item-zoom-image")).each(function(index, element) {
			
				if(index_ativo==index){
					changeImage({bt:$(this)});
				}
			
			});
		}
		
		//--------------------
		//bts de zoom
		
		function zoomIn () {
			
			var _drag = $(wrapper_geral.find("#barra #scroll"));//barra
			var _box = $(wrapper_geral.find("#barra"));
			
			var _maxValue = (_data.sliderOrientation == "horizontal") ? _box.width() - _drag.width() :  _box.height() - _drag.height();
			
			if(posDragMove<_maxValue){
				posDragMove += moveDrag;
				if(_data.sliderOrientation == "horizontal")
				{
					_drag.css({left:posDragMove});
				}
				else
				{
					_drag.css({top:posDragMove});
				}
				
				reposImage();
			}else{
				//do nothing
			}
			
			return false;
			
		}
		
		function zoomOut () {
			
			var _drag = $(wrapper_geral.find("#barra #scroll"));//barra
			var _box = $(wrapper_geral.find("#barra"));
			
			var _maxValue = (_data.sliderOrientation == "horizontal") ? _box.width() - _drag.width() :  _box.height() - _drag.height();
			
			if(posDragMove>0){
				posDragMove -= moveDrag;
				
				if(_data.sliderOrientation == "horizontal")
				{
					_drag.css({left:posDragMove});
				}
				else
				{
					_drag.css({top:posDragMove});
				}
				reposImage();
			}else{
				//do nothing
			}
			
			return false;
			
		}
		
		//------------------------------------
	
		function resizeHandler () {
			
			var _wrapper = wrapper_geral.find(".wrapper");
			var _width = $(window).width()-(_data.positionZoom.left+_data.positionZoom.right);
			var _height = $(window).height() - (_data.positionZoom.top+_data.positionZoom.bottom) - wrapper_geral.find(".footer").height()-$("#aba-lista").height();
			_wrapper.css({width:_width, height:_height});
			
			reposImage ();
			
		}//end resizeHandler
		
		//------------------------------------
		
		function loadImage () {
			var _body = jQuery(document.body);
			
			//remove a imagem caso exista
			wrapper_geral.find(".wrapper img").remove();
			
			var img = new Image();
			
			if(_data.loader != "")
			{
				var _loader = $("<div class='loader_overlay'><img src='"+_data.loader+"'></div>");
				_body.append(_loader);
			}
			
			$(img).load(function(){
					  
				firstLoad = false;
				
				if(_data.loader != "")
				{
					_loader.remove();
				}
							
				wrapper_geral.find(".wrapper").append($(this));
				
				//image loaded
				_wrapperResize = wrapper_geral.find(".wrapper img");							
				_wrapperResize.css({ display:"block", opacity:0});
				_wrapperResize.animate({opacity:1},300);
				_wrapperResize.addClass('dragme');
				
				_originalWidth = _wrapperResize.width();
				_originalHeight = _wrapperResize.height();
								
				var _drag = wrapper_geral.find("#barra #scroll");//barra
				
				if(_data.sliderOrientation == "horizontal")
				{
					_drag.css({left:0});
				}
				else
				{
					_drag.css({top:0});
				}
							
				reposImage();
			
			}).attr({
			  src: _imageLoad
			}).error(function(){
			  //do something if image cannot load
			});
			
		}//end loadImage
		
		//------------------------------------
		function reposImage () {
		
			var _drag = wrapper_geral.find("#barra #scroll");//barra
			var _box = wrapper_geral.find("#barra");
			var posDrag = (_data.sliderOrientation == "horizontal") ? parseFloat(getSize(_drag,"left")) : parseFloat(getSize(_drag,"top"));
			var _newWid;
			var _newHei;
			var _posMaxDrag = (_data.sliderOrientation == "horizontal") ? _box.width()-_drag.width() : _box.height()-_drag.height();
					
			if(_wrapperResize)	{
				if(!firstLoad){//checa se foi a primeira vez que a imagem foi carregada
					
					firstLoad = true;
					
					scaleResize = Math.min(_wrapper.width()/_originalWidth,_wrapper.height()/_originalHeight);
					
					//checa se a imagem é menor que a altura ou a largura do wrapper com a mascara
					if(scaleResize < 1){
					}else{
						scaleResize = 1;
					}
					
					if(_data.resizeInitial)//redimensiona imagem para ela caber no frame de visualização
					{
						_newWid = _originalWidth*scaleResize;
						_newHei = _originalHeight*scaleResize;
					}
					else
					{
						_newWid = _originalWidth;
						_newHei = _originalHeight;
						_drag.css({left:_posMaxDrag});
						posDrag = parseFloat(getSize(_drag,"left"));
					}
					
				}else{
					
									
					var _newHeightImg = (((_originalHeight - _wrapper.height())/_posMaxDrag)*posDrag) + _wrapper.height();
					var _scale = _newHeightImg / _originalHeight;
					
					_newHei = _newHeightImg;
					_newWid = _originalWidth * _scale;
										
				}
				
				posDragMove = posDrag;
				
				var _center_x = (_wrapper.width()-_newWid)/2;
				var _center_y = (_wrapper.height()-_newHei)/2;
				
				_left = _center_x;
				_top = _center_y;
				
				_wrapperResize.css({width:_newWid, height:_newHei, left:_left, top:_top});
				
			}	
				
		}//end reposImage
		
		//===================================================================================
		//===================================================================================   
	};
			
})(jQuery);