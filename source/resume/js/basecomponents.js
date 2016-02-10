		var Fragment = React.createClass({
			getDefaultProps:function(){
				return {
					option:{
						name:'',
						comment:'',
						startDate:'',
						endDate:'',
						summary:'',
						detail:[]
					}
				}
			},
			render:function(){
						var frag = this.props.option;
						
						if(frag.startDate&&frag.endDate){
							var _dateComp =<div className="date">
										<span>{frag.startDate}</span>
										<span>-</span>
										<span>{frag.endDate}</span>
									  </div>
						}
						
						if(frag.summary){
							var _summaryComp =
									<div className="fragment-summary">
										<div>{frag.summary}</div>
									</div>
						}
						
						return (
							<div className="fragment">
								<div className="circle-point"></div>
								<div className="fragment-content-wrapper">
									<span className="fragment-name">{frag.name}</span>			
									<span className="fragment-comment">{frag.comment}</span>			
									<div className="fragment-content">
										{_summaryComp}
										<div className="fragment-list">
											<ul>
												{frag.detail.map(function(e){return <li>{e}</li>})}
											</ul>
										</div>
										
										{_dateComp}
										
									</div>
								</div>
							</div>
						)
			}
		});
		
		var Section = React.createClass({
			getDefaultProps:function(){
				return {
					title:"sectionTitle",
					fragments:[],
					points:[]
				}
			},
			
			render:function(){
				var actualEle;
				if(this.props.fragments.length>0){
					var frags=[];
					for(var i=0;i<this.props.fragments.length;i++){
						var frag = this.props.fragments[i];
						var fragComponent=<Fragment option={frag}/>
						frags.push(fragComponent);
					}
					actualEle = frags;
				}else if(this.props.points.length>0){
					var liElement = [];
					for(var i=0;i<this.props.points.length;i++){
						var point = this.props.points[i];
						liElement.push(<li>{point}</li>);
					}
					var pointEle=<div className="points-container"><ul>{liElement}</ul></div>;
					actualEle = pointEle;
				}
				return (
							<div className="section">
								<h2 className="section-title">{this.props.title}</h2>
								<div className="section-content">{actualEle}</div>
							</div>
					)
			}
			
		});