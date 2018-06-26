var llk={
    $stage:null,
    $time:null,
    $ctx:null, //绘图要用
    types:['red','black','green','pink','black','brown','blueviolet','orange'],
    rows:7,
    cols:10,
    width:50,
    height:50,
    gap:7,
    //维护连连看数据结构
    matrix:[],
    playing:false,
    //用来记录上一个选中的节点
    selected:null,
    
    AI:function(){
        var self=this;
        for(var i=1;i<this.cols*this.rows;i++){
            setTimeout(function(){self.AI_delete();},i*200);
        }
    },

    AI_delete:function(){
        var goal;
        for(var i=0;i<this.rows;i++){
            for(var j=0;j<this.cols;j++){
                if(!this.IsDisappear(this.matrix[i][j].el)){
                    goal=this.matrix[i][j].el;
                    if(this.AI_search(goal)) return;
                }
            }
        }
    },
    AI_search:function(tile){
        for(var i=0;i<this.rows;i++){
            for(var j=0;j<this.cols;j++){
                if((!this.IsDisappear(this.matrix[i][j].el)) && this.handle_disappear(tile,this.matrix[i][j].el)){
                    tile.classList.add("disappear");
                    this.matrix[i][j].el.classList.add("disappear");
                    return true;
                }
            }
        }
        return false;
    },

    init:function(){
        var canvas=document.createElement('canvas');
        var ctx=canvas.getContext('2d');

        //设置stage主界面的长，宽以及水平垂直居中
        this.$stage=document.getElementById("stage")
        stage_height=this.height*this.rows+(this.rows-1)*this.gap;
        stage_width=this.width*this.cols+(this.cols-1)*this.gap;
        this.$stage.style.height=stage_height+"px";
        this.$stage.style.width=stage_width+"px";

        //设置垂直居中
        this.$stage.style.top="50%";
        this.$stage.style.left="50%";
        this.$stage.style.marginTop=(-stage_height/2)+"px";
        this.$stage.style.marginLeft=(-stage_width/2)+"px";

        //canvas用来画线，所以要比stage大一个单位长度
        canvas.width=(this.cols+2)*(this.width+this.gap)-this.gap;
        canvas.height=(this.rows+2)*(this.height+this.gap)-this.gap;
        canvas.style.top=-this.height-this.gap+"px";
        canvas.style.left=-this.width-this.gap+"px";

        //啦啦啦
        ctx.translate(this.width+this.gap,this.height+this.gap);

        this.$stage.appendChild(canvas);
        this.$ctx=ctx;

    },

    build: function(){
        var self=this;
        var fragment=document.createDocumentFragment();
        var tiles=new Array(this.rows*this.cols);
        var count=this.types.length-1;

        //设置消除对数，不存在偶数的情况
        if(!this.pairs){
            this.pairs=this.rows*this.cols/2;
        }

        for(var i=0,l=this.pairs*2;i<l;){
            tiles[i]=tiles[i+1]=this.types[this.random(count)];
            i+=2;
        }

        //对title进行洗牌
        tiles=this.shuffle(tiles);

        for(var row=0;row<this.rows;row++){
            this.matrix[row]=[];
            for(var col=0;col<this.cols;col++){
                var type=tiles.shift();
                
                //?
                if(!type){
                    this.matrix[row][col]=null;
                    continue;
                }

                let tile=document.createElement('div');
                tile.style.top=(row*(this.height+this.gap))+"px";
                tile.style.left=(col*(this.width+this.gap))+"px";
                //设置x,y用于数据结构判断

                tile.x=col;
                tile.y=row;
                tile.type=type;
                tile.className="tile "+type;
                 
                tile.addEventListener("click",function(){
                    //注意function中的this和self区别
                    self.HaddleClick(event);
                },false);

                fragment.appendChild(tile);

                //赋值matrix
                this.matrix[row][col]={
                    type:type,
                    el:tile,
                }

            }
        }
        this.matrix[-1]=this.matrix[this.rows]=[];

        //清楚界面上所有节点
        this.$stage.appendChild(fragment);
        console.log(this.matrix);
    },

    //处理点击
    HaddleClick:function(event){
        //输出元素用于test
        console.log(this);
        //获取事件产生控件
        var target_Tag=event.target;
        //这是可以设置反转的属性
        target_Tag.classList.toggle("selected");
    
        //已经有选中的元素
        if(this.selected){
            //选中的元素与上一次相同
            if(target_Tag==this.selected){
                return 
            }else{
                if(target_Tag.type==this.selected.type){
                    //选中且颜色相同

                    //相同则判断路径是否可达
                    if(this.handle_disappear(target_Tag,this.selected)){
                        //路径可达
                        target_Tag.classList.add("disappear");
                        this.selected.classList.add("disappear");   
                        this.selected=null;
                    }else{
                        //路径不可达，移除上一次选中的样式
                        this.selected.classList.remove("selected");
                        this.selected=target_Tag;
                    }
                    
                }else{
                    //选中但颜色不同
                    this.selected.classList.remove("selected");    
                    this.selected=target_Tag;
                }
            }
        }else{
            //没有算中的元素
            this.selected=target_Tag
        }
        

        
    },
    //控制画线和判断路径
    handle_disappear:function(target1,target2){
        if(target1.type!=target2.type) return false;
        if(target1==target2) return false;

        axis_list=this.judge_disapper(target1,target2);
        if(axis_list){
            this.DrawTipLine(axis_list);
            //置空
            return true;
        }else{
            return false;
        }
    },

    //判断是否可以相连
    //这样处理可以将画图逻辑与判断逻辑分离
    judge_disapper:function(target1,target2){
        
        var axis_list;

        //水平直线
        axis_list=this.LinkInCol(target1,target2)
        if(axis_list) return axis_list;

        //竖直直线
        axis_list=this.LinkInRow(target1,target2);
        if(axis_list) return axis_list;
        
        //两条直线
        axis_list=this.linkInOneCorner(target1,target2)
        if(axis_list) return axis_list;
        
        //在边上
        axis_list=this.LinkInSides(target1,target2);
        if(axis_list) return axis_list;
        
        //三条直线
        axis_list=this.linkInTwoCorner(target1,target2)
        if(axis_list) return axis_list;

        return null;
    },

    //判断一条水平直线相连
    LinkInRow:function(target1,target2){
        //在一条水平直线上
        var axis_list=[];

        if(target1.y == target2.y){
            //获取一条直线上坐标
            var left = Math.min(target1.x,target2.x);
            var right = Math.max(target1.x,target2.x);
        
            var yIndex=target1.y;

            axis_list=this.GetAxisList([target1,target2]);

            for(var i=left+1;i<right;i++){
                //通过判断类名中是否含有"disappear"属性
                if(!this.IsDisappear(this.matrix[yIndex][i].el)){
                    return null;
                }
            }
            return axis_list;
        }
        return null;
    },

    //判断一条竖直直线相连
    LinkInCol:function(target1,target2){
        //在一条竖直直线上
        var axis_list=[];

        if(target1.x == target2.x){
            var top = Math.min(target1.y,target2.y);
            var bottom = Math.max(target1.y,target2.y);
            var xIndex=target1.x;

            axis_list=this.GetAxisList([target1,target2]);

            for(var i=top+1;i<bottom;i++){
                //通过判断类名中是否含有"disappear"属性
                if(!this.IsDisappear(this.matrix[i][xIndex].el)){
                    return null;
                }
            }
            return axis_list;
        }
        return null;
    },

    //判断两条直线相连
    linkInOneCorner:function(target1,target2){
        //情况1
        var corner1_tag=this.matrix[target1.y][target2.x].el;
        var corner2_tag=this.matrix[target2.y][target1.x].el;
        
        if(this.IfCanMove(target2,corner1_tag) && this.LinkInRow(corner1_tag,target1)){
            var axis_list=this.GetAxisList([target2,corner1_tag,target1]);
            return axis_list;
        } 

        if(this.IfCanMove(target1,corner2_tag) && this.LinkInRow(corner2_tag,target2)){
            var axis_list=this.GetAxisList([target1,corner2_tag,target2]); 
            return axis_list;
        }  

        return null;
    },

    //判断三条直线相连
    linkInTwoCorner:function(target1,target2){
        //判断水平三条线连接
        for(var i=0;i<this.rows;i++){
            var tar1_move=this.matrix[i][target1.x].el;
            var tar2_move=this.matrix[i][target2.x].el;

            //可以移动过去
           if(this.IfCanMove(target1,tar1_move)&&this.IfCanMove(target2,tar2_move)){
                //移动过去之后有连线,或者在边上
                var side=this.LinkInSides(tar1_move,tar2_move);
                var row=this.LinkInRow(tar1_move,tar2_move);
                if(side){
                    return this.GetAxisList([target1,tar1_move]).concat(side).concat(this.GetAxisList([tar2_move,target2]));
                }
                
                if(row){
                    return this.GetAxisList([target1,tar1_move,tar2_move,target2]);
                }
           }
                
       }

        //判断垂直三条直线相连接
        for(var i=0;i<this.cols;i++){
            var tar1_move=this.matrix[target1.y][i].el;
            var tar2_move=this.matrix[target2.y][i].el;


            if(this.IfCanMove(target1,tar1_move)&&this.IfCanMove(target2,tar2_move)){
                //移动过去之后有连线,或者在边上
                var side=this.LinkInSides(tar1_move,tar2_move);
                var col=this.LinkInCol(tar1_move,tar2_move)
                if(side){
                    return this.GetAxisList([target1,tar1_move]).concat(side).concat(this.GetAxisList([tar2_move,target2]));
                }
                
                if(col){
                    return this.GetAxisList([target1,tar1_move,tar2_move,target2]);
                }
           }

        }

        return false;
    },

    LinkInSides:function(target1,target2){
        var axis_list=this.GetAxisList([target1,target1,target2,target2]);

        //判断两个在同一条边上
        if(target1.x==0&&target2.x==0){
            axis_list[2]-=this.width;
            axis_list[4]-=this.width;

            return axis_list;
        }

        if(target1.y==0&&target2.y==0){
            axis_list[3]-=this.height;
            axis_list[5]-=this.height;

            return axis_list;
        }  
        

        if(target1.x==this.cols-1&&target2.x==this.cols-1) {
            axis_list[2]+=this.width;
            axis_list[4]+=this.width;

            return axis_list;
        }        
        if(target1.y==this.rows-1&&target2.y==this.rows-1) {
            axis_list[3]+=this.height;
            axis_list[5]+=this.height;

            return axis_list;
        }

        return null;
    },

    random: function(min, max) {
        if (max == null) {
            max = min;
            min = 0;
        };
        return min + Math.floor(Math.random() * (max - min + 1));
    },

    shuffle: function(array) {
        var length = array.length;
        var shuffled = Array(length);
        for (var index = 0, rand; index < length; index++) {
            rand = this.random(0, index);
            if (rand !== index) shuffled[index] = shuffled[rand];
            shuffled[rand] = array[index];
        }
        return shuffled;
    },

    //判断元素是否消失
    IsDisappear:function(tile){
        return tile.classList.contains("disappear");
    },

    //tile1=>tile2
    IfCanMove:function(tile1,tile2){
        if(tile1==tile2) return true;
        if(tile1.y==tile2.y&&this.IsDisappear(tile2)&&this.LinkInRow(tile1,tile2)) return true;
        if(tile1.x==tile2.x&&this.IsDisappear(tile2)&&this.LinkInCol(tile1,tile2)) return true;
        return false;
    },
    
    DrawTipLine:function(axis_list){
        
        ctx=this.$ctx;
        ctx.beginPath();  

        
        for(var i=2;i<axis_list.length;i+=2){
            ctx.moveTo(axis_list[i-2],axis_list[i-1]);
            ctx.lineTo(axis_list[i],axis_list[i+1]);    
        }


        ctx.closePath();  
        ctx.strokeStyle = "red";  
        ctx.stroke();  

        //注意这里实现的方法
        var self=this;
        setTimeout(function(){self.clearCanvas();},100);
    },

    GetAxisList:function(tile_list){
        var axis_list=[];

        for(var i=0;i<tile_list.length;i++){
            axis_list.push(tile_list[i].x*(this.width+this.gap)+this.width/2);
            axis_list.push(tile_list[i].y*(this.height+this.gap)+this.height/2);
        }

        return axis_list;
    },

    clearCanvas:function()  
    {  
        var width=(this.cols+2)*(this.width+this.gap)-this.gap;
        var height=(this.rows+2)*(this.height+this.gap)-this.gap;
        var cxt=this.$ctx
        cxt.clearRect(-(this.width+this.gap),-(this.height+this.gap),width,height);  
    }  


}
llk.init();
llk.build();

//自动连线按钮
var button=document.getElementById("button_AI");
button.addEventListener("click",function(){
    llk.AI();
})

//llk.DrawTipLine([100,100,100,200,300,200])