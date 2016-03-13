﻿		var Resume = React.createClass({
			getDefaultProps:function (){
				console.log('[Resume]getDefaultProps');
				return {
					json:{}
				}
			},
			

			getInitialState:function(){
				console.log('[Resume]getInitialState');
				return {
					
				}
			},

			render:function(){

				var cSumary = <Summary summary = {this.props.json.summary}/>;
				var cWork = <Work workExperience = {this.props.json.workExperience}/>
				var cProject = <ProjectExperience projectExperience = {this.props.json.projectExperience}/>
				var cOtherSection = <OtherSections sections={this.props.json.sections}/>
				var cCourse = <Course courses={this.props.json.courses}/>
				var cEdu = <Educations educations={this.props.json.educations}/>;
				
				var comps=[cSumary,cWork,cProject,cOtherSection,cCourse,cEdu];
				
				return (
					<div id="mainContent">
						<Info name={this.props.json.name} 
							  birth={this.props.json.birth}
							  email={this.props.json.email}
							  tel={this.props.json.tel}
							  avatar={this.props.json.avatar}
							  pages={this.props.json.pages}
							  />
						<div id="resumeContent">
							{comps}
						</div>
					</div>
				)
			},
			
			componentDidMount:function(){
				console.log('componentDidMount');
			}
		})
		
		var PageIcon=React.createClass(		
			function(){
				var iconfontKeymap = {
						"weixin": "&#xe603;",
						"zhihu": "&#xe607;",
						"douban": "&#xe605;",
						"github": "&#xe604;",
						"weibo": "&#xe601;",
						"stackoverflow": "&#xe600;",
						"segmentfault": "&#xe602;",
						"lofter": "&#xe608;",
						"linkedin": "&#xe606;"
				};
				return {
					getDefaultProps:function(){
						return {
							page:{}
						}
					},


					render:function(){
						var pageUrl;
						for( var key in this.props.page){
							pageUrl=this.props.page[key];
							break;
						}
						return (<a ref="iconFontSpan" className="page-icon-font" href={pageUrl} target="_blank"></a>)
					},
					componentDidMount:function(){
						var page="default";
						
						for( var key in this.props.page){
							page=key.toLowerCase();
							break;
						}
						
						console.log("page=",page," icon-font:",iconfontKeymap[page]);
						console.log(React.findDOMNode(this.refs.iconFontSpan));
						$(React.findDOMNode(this.refs.iconFontSpan)).html(iconfontKeymap[page]);
						}
				}
			}());
		
		var Info  = React.createClass({
			getDefaultProps:function(){
				return {
					name:null,
					birth:null,
					tel:null,
					email:null,
					avatar:'/image/avatar.jpg',
					pages:[]
				}
			},
			render:function(){
				console.log(this.props.avatar);
				var aPages=[];
				for(var i = 0;i<this.props.pages.length;i++){
					var cPage = <PageIcon page={this.props.pages[i]}/> ;	
					aPages.push(cPage);
				}
				return (
					<div className="info" >
						<div className="info-brief" >
							<div className="avatar"><img src={this.props.avatar}/></div>
							<div className="name">{this.props.name}</div>
							<div className="birth" ref="birth">{this.props.birth}</div>
							<div className="pages-link">
								{aPages}
							</div>
						</div>
						<div className="info-contact">
								<div>电话:{this.props.tel}</div>
								<div>邮件:{this.props.email}</div>
						</div>
					</div>
				)
			},
		});
		
		var Summary = React.createClass({
			getDefaultProps:function(){
				return {
					summary:[]
				}
			},			
			render:function(){
				var summary = this.props.summary;
				var lis = [];
				for(var i=0;i<summary.length;i++){
					lis.push(<li>{summary[i]}</li>);
				};

				return (
								<div className="summary section">
									<h2 className="section-title">概述</h2>
									<div className="section-content">
										<ul>
											{lis}
										</ul>
									</div>
								</div>
						)
						
			}
				
		});
		
		
		var Work = React.createClass({
			getDefaultProps:function(){
				workExperience:[]
			},
			
			render:function(){
				var ex=[];
				var workExperience = this.props.workExperience;
				
				for(var i =0;i<workExperience.length;i++){
					var we = workExperience[i]
					var fragmentOption={
						name:we.company,
						comment:we.post,
						startDate:we.startDate,
						endDate:we.endDate,
						summary:we.summary,
						detail:we.detail
					};
					//<Fragment option={fragmentOption}/>
					console.log(we,"companyLogo: ",we.companyLogo)
					var work = 
								<div className="work-Fragment">
									<div className="work-date">
										<div>{we.startDate}</div>
										<div className="date-separator"></div>
										<div>{we.endDate} </div>
									</div>
									
									<div className="companyLogo circle-point">
										{we.company[0]}
									</div>
										
									<div className="work-content">
										<h2>{we.company}</h2>
										<h3>{we.post}</h3>
										
										<div className="work-detail">
											<ul>
												{
													we.detail.map(function(e){return <li>{e}</li>})
												}
											</ul>
										</div>
									</div>
								</div>;

					
					ex.push(work);
				}
			
				return(
					<div className="section work-experience">	
						<h3 className="section-title">工作经历</h3>
						<div className="section-content">{ex}</div>
					</div>
				)
			}
			
		});
		
		
		var ProjectExperience = React.createClass({
			getDefaultProps:function(){
				projectExperience:[]
			},
			
			render:function(){
			
				var ex=[];
				
				var projectExperience = this.props.projectExperience;
				for(var i =0;i<projectExperience.length;i++){
					var pe = projectExperience[i]
					var fragmentOption={
						name:pe.projectName,
						comment:pe.role,
						startDate:pe.startDate,
						endDate:pe.endDate,
						summary:pe.summary,
						detail:pe.detail
					}		
					
					var project = 
						<div className="project-Fragment">
							<Fragment option={fragmentOption}/>
						</div>;
					ex.push(project);
				}
			
				return (
					<div className=" section project-experience">
						<h3 className="section-title">项目经历</h3>
						<div className="timeline-section-content">{ex}</div>
					</div>
				)
			}
		});
		
		

		
		var OtherSections = React.createClass({
			getDefaultProps:function(){
				return {
					sections:[]
				}
			},
			
			render:function(){
				var secComponents=[];
				
				for(var i=0;i<this.props.sections.length;i++){
					var sec = this.props.sections[i];
					var secComponent=<Section title={sec.title} fragments = {sec.fragments} points = {sec.points}/>
					secComponents.push(secComponent);
				}
				return (
							<div className="common-sections">
								{secComponents}
							</div>
					)
			}
			
		});
		
		var Course  =  React.createClass({
			getDefaultProps:function(){
				return {
					courses:[]
				}
			},
			
			render:function(){
				var courses = this.props.courses;
				var liElements = [];
				for(var i =0;i<courses.length;i++){
					var course = courses[i];
					var li=<div><span>{course.courseName}</span><span>{course.courseProvider}</span></div>
					liElements.push(li);
				}
			
				return (
					
					liElements.length>0?
						<div className="section course">
							<h2 className="section-title">MOOC证书</h2> 
							<div className="section-content">{liElements}</div>
						</div>
						:<div></div>
				)
			}
		});
		
		var Educations = React.createClass({
		
			getDefaultProps:function(){
				return {
					educations:[{
						university:'',
						studyType:'',
						major:'',
						startDate:'',
						endDate:'',
						gpa:'',
						scholarships:[],
						experiences:[]
					}]
				}
			}
			,
			render:function(){
				var educations = this.props.educations;
				var eduEles = [];
				for(var i=0;i<educations.length;i++){
					var edu = educations[i];
					//在校实践
					var exe = edu.experiences&&edu.experiences.length>0?
								<div className="education-exeperience">
									<ul>
										{edu.experiences.map(function(e){return <li>{e}</li>})}
									</ul>
								</div>:'';
					
					var section = 					
						<div className="section-content">
								<div className="university">{edu.university}</div>								
								<div className="major"><span className="major-name">{edu.major}</span>|<span className="study-type">{edu.studyType}</span></div>
								<div className="date">
										<span>{edu.startDate}</span>
										<span>-	</span>
										<span>{edu.endDate}</span>
								</div>
								
								<div className="edu-content">
									<div className="score">
										<div className="gpa"><span>GPA:{edu.gpa}</span></div>
										<div className="scholarship"><span>奖学金:{edu.scholarships.join(' ')}</span></div>
									</div>
									{exe}
								</div>

						</div>
					
					eduEles.push(section);
				}
				return (
					<section className="section education-section">
						<h3 className="section-title">教育经历</h3>
						{eduEles}
					</section>
				)
			}
		})